// นำเข้า Express เพื่อใช้งาน Router
const express = require('express');
const router = express.Router();
// นำเข้าฐานข้อมูลและส่วนเสริมต่างๆ
const db = require('../config/db');
const upload = require('../config/upload'); // ใช้สำหรับอัปโหลดรูปภาพ
const admin = require('../config/firebaseAdmin'); // ใช้ Firebase Admin SDK เพื่อถอดรหัส Token
const { generateId } = require('../utils/idGenerator'); // ฟังก์ชันช่วยสุ่มรหัส ID ใหม่

// สร้าง API เส้นทาง /auth/firebase (รองรับ HTTP POST)
router.post('/auth/firebase', async (req, res) => {
    // ดึงข้อมูลที่ฝั่ง Frontend (React) ส่งมาให้ใน Body
    const { idToken, email, name, picture, uid } = req.body;

    // ถ้าไม่มี Token แนบมาด้วย ให้เตะกลับพร้อมแจ้งว่า Unauthorized (ไม่มีสิทธิ์)
    if (!idToken) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        // 1. นำ Token ที่ได้ ไปถาม Google โดยตรงว่า "นี่ของจริงหรือของปลอม?" (เพื่อความปลอดภัย)
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const verifiedUid = decodedToken.uid; // รหัสผู้ใช้จริงจาก Google

        // 2. ดึงข้อมูลอีเมล ชื่อ และรูปภาพ ที่แกะออกมาจาก Token 
        // (ถ้า Token ไม่มีข้อมูล ค่อยดึงจาก req.body สำรอง)
        // ใช้อีเมลจาก Token ที่ Firebase ยืนยันแล้วเท่านั้น (ไม่เชื่ออีเมลที่หน้าบ้านส่งมาเอง เพราะแก้ปลอมได้)
        const userEmail = (decodedToken.email || '').toLowerCase();
        const userName = decodedToken.name || name || 'ผู้ใช้งาน';
        const userPic = decodedToken.picture || picture;

        // จำกัดการเข้าใช้งาน: ลูกค้าต้องใช้อีเมล @ku.th ที่ยืนยันแล้วเท่านั้น
        // ยกเว้นบัญชีแอดมิน/แม่บ้านที่ลงทะเบียนไว้ในระบบแล้ว (ซึ่งใช้อีเมลอื่นได้) จะตรวจในขั้นตอนถัดไป
        const isKuEmail = userEmail.endsWith('@ku.th') && decodedToken.email_verified !== false;
        const KU_ONLY_MESSAGE = 'ระบบนี้ใช้ได้เฉพาะบัญชีอีเมล @ku.th เท่านั้น';
        if (!userEmail) {
            return res.status(403).json({ success: false, error: KU_ONLY_MESSAGE, code: 'KU_EMAIL_ONLY' });
        }

        // 3. เอาอีเมลที่ได้ ไปค้นหาในตาราง `users` ของฐานข้อมูล (MySQL)
        db.query('SELECT * FROM users WHERE email = ?', [userEmail], (err, results) => {
            // ถ้าค้นหาแล้ว Database แจ้ง Error ให้ส่ง Error กลับไปหน้าบ้าน
            if (err) return res.status(500).json({ success: false, error: err.message });

            // อีเมลไม่ใช่ @ku.th: ผ่านได้เฉพาะแอดมิน/แม่บ้านที่มีอยู่ในระบบแล้ว นอกนั้นปฏิเสธ (รวมถึงห้ามสมัครบัญชีใหม่)
            const existingRole = results.length > 0 ? results[0].role : null;
            if (!isKuEmail && !['admin', 'maid'].includes(existingRole)) {
                return res.status(403).json({ success: false, error: KU_ONLY_MESSAGE, code: 'KU_EMAIL_ONLY' });
            }

            // 4. ถ้าเจอข้อมูล แปลว่าเป็นผู้ใช้เก่า (เคยล็อกอินแล้ว)
            if (results.length > 0) {
                const user = results[0]; // เก็บข้อมูลผู้ใช้คนนั้น
                let updateQueries = []; // เตรียมเก็บคำสั่งแก้ไขข้อมูล
                let updateParams = []; // เตรียมเก็บข้อมูลที่จะแก้ไข

                // 4.1 ถ้าในระบบยังไม่มี google_id ให้เพิ่มเข้าไป
                if (!user.google_id) {
                    updateQueries.push('google_id = ?');
                    updateParams.push(verifiedUid);
                }

                // 4.2 ถ้าในระบบไม่มีรูปโปรไฟล์ แต่ล็อกอินรอบนี้มีรูปมาด้วย ให้อัปเดตรูป
                if (!user.profile_pic && userPic) {
                    updateQueries.push('profile_pic = ?');
                    updateParams.push(userPic);
                    user.profile_pic = userPic; // อัปเดตในตัวแปรด้วย
                }

                // ถ้ามีการอัปเดตข้อมูลใดๆ ให้สั่ง UPDATE ลง Database
                if (updateQueries.length > 0) {
                    updateParams.push(user.user_id);
                    db.query(`UPDATE users SET ${updateQueries.join(', ')} WHERE user_id = ?`, updateParams);
                }

                // ส่งคำตอบกลับไปบอกหน้าบ้านว่า "สำเร็จ" พร้อมส่งข้อมูลผู้ใช้กลับไปให้แสดงผล
                res.json({ success: true, user: user });
            } else {
                // 5. ถ้าไม่เจอข้อมูล แปลว่าเป็น "ผู้ใช้ใหม่" ต้องสร้างบัญชีให้ใหม่
                let role = 'user'; // กำหนดให้ทุกคนที่สมัครเป็น 'ลูกค้า (user)' ไว้ก่อน
                
                // สร้าง ID ใหม่ (เช่น U0001) ด้วยฟังก์ชัน generateId
                generateId('U', 'users', 'user_id').then(newUserId => {
                    // นำข้อมูลผู้ใช้ใหม่ ยัดลงตาราง (INSERT)
                    db.query('INSERT INTO users (user_id, email, fullname, google_id, role, profile_pic) VALUES (?, ?, ?, ?, ?, ?)',
                        [newUserId, userEmail, userName, verifiedUid, role, userPic], (insertErr, result) => {
                            // ถ้า Insert พัง ให้แจ้ง Error
                            if (insertErr) return res.status(500).json({ success: false, error: insertErr.message });
                            
                            // ถ้า Insert สำเร็จ ส่งข้อมูลกลับไปให้หน้าบ้าน
                            res.json({ success: true, user: { user_id: newUserId, email: userEmail, fullname: userName, role, profile_pic: userPic, google_id: verifiedUid } });
                        });
                }).catch(genErr => {
                    // ถ้าการสุ่ม ID พัง แจ้ง Error
                    res.status(500).json({ success: false, error: 'Failed to generate ID' });
                });
            }
        });
    } catch (error) {
        // ถ้าแกะ Token ไม่ผ่าน หรือ Token หมดอายุ จะตกลงมาที่นี่
        console.error('Error verifying Firebase ID token:', error);
        res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
});

// API สำหรับให้ผู้ใช้แก้ไขข้อมูลส่วนตัว (เช่น เปลี่ยนชื่อ, เบอร์โทร, อัปโหลดรูป)
router.put('/users/:id/profile', upload.single('profile_pic'), (req, res) => {
    // รับข้อมูลชื่อและเบอร์โทร จาก Form
    const { fullname, phone } = req.body;
    // เตรียมคำสั่ง SQL อัปเดตข้อมูล
    let sql = 'UPDATE users SET fullname = ?, phone = ?';
    let params = [fullname, phone];

    // ถ้ามีการอัปโหลดไฟล์รูปแนบมาด้วย
    if (req.file) {
        sql += ', profile_pic = ?'; // เพิ่มคำสั่งให้บันทึก path ของรูปด้วย
        params.push(`/uploads/${req.file.filename}`); // เซฟชื่อไฟล์ลง Database
    }
    sql += ' WHERE user_id = ?'; // ระบุว่าจะแก้ของ user คนไหน (อิงตาม URL)
    params.push(req.params.id);

    // สั่งรันคำสั่ง SQL
    db.query(sql, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // ถ้าอัปเดตสำเร็จ ให้ไปดึงข้อมูลใหม่ที่เพิ่งแก้ขึ้นมาส่งกลับให้หน้าจอ
        db.query('SELECT * FROM users WHERE user_id = ?', [req.params.id], (err2, results) => {
            if (err2) return res.status(500).json({ error: 'Updated but fetch failed' });
            // ไม่พบผู้ใช้รหัสนี้ (เช่นเบราว์เซอร์ยังจำรหัสเก่าที่ถูกเปลี่ยนในฐานข้อมูลแล้ว) ให้ตอบ 404 ที่อ่านรู้เรื่อง
            if (results.length === 0) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' });
            res.json({ success: true, user: results[0] });
        });
    });
});

// ส่งออก Router ให้ server.js เอาไปใช้งาน
module.exports = router;