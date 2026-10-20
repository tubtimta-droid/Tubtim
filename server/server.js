// โหลดตัวแปรสภาพแวดล้อม (Environment Variables) จากไฟล์ .env มาใช้งาน
require('dotenv').config();
// นำเข้า Express ซึ่งเป็น Framework สำหรับสร้าง Web Server ใน Node.js
const express = require('express');
// นำเข้า CORS (Cross-Origin Resource Sharing) เพื่ออนุญาตให้หน้าเว็บ (ที่อาจจะรันคนละพอร์ต) เรียกใช้งาน API นี้ได้
const cors = require('cors');
// นำเข้าไลบรารี path สำหรับจัดการเรื่องที่อยู่ของไฟล์ (File Paths) ในระบบ
const path = require('path');

// สร้าง Express App (เปรียบเสมือนตัวเซิร์ฟเวอร์ของเรา)
const app = express();
// กำหนดให้เซิร์ฟเวอร์รันที่พอร์ต 3001
const port = 3001;

// --- MIDDLEWARE (ตัวดักจับและแปลงข้อมูลก่อนเข้าสู่ระบบจริง) ---
app.use(cors()); // อนุญาตให้เชื่อมต่อข้ามโดเมนได้
app.use(express.json()); // สั่งให้เซิร์ฟเวอร์อ่านข้อมูลที่ส่งมาเป็นรูปแบบ JSON ได้
app.use(express.urlencoded({ extended: true })); // สั่งให้อ่านข้อมูลจาก Form ทั่วไปได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/backend-images/uploads', express.static(path.join(__dirname, 'uploads')));

// --- เชื่อมต่อฐานข้อมูล ---
// โหลดไฟล์ db.js ขึ้นมาทำงาน ซึ่งไฟล์นี้จะไปต่อกับ MySQL ให้อัตโนมัติ
require('./config/db'); 

// --- นำเข้า ROUTERS ทั้งหมด (ไฟล์แบ่งหมวดหมู่ API) ---
const authRoutes = require('./routes/authRoutes'); // API เกี่ยวกับการล็อกอิน
const maidRoutes = require('./routes/maidRoutes'); // API เกี่ยวกับแม่บ้าน
const bookingRoutes = require('./routes/bookingRoutes'); // API เกี่ยวกับการจอง
const paymentRoutes = require('./routes/paymentRoutes'); // API เกี่ยวกับการชำระเงิน
const refundRoutes = require('./routes/refundRoutes'); // API เกี่ยวกับการคืนเงิน
const cronRoutes = require('./routes/cronRoutes'); // API สำหรับ Cron Jobs
const reviewRoutes = require('./routes/reviewRoutes'); // API เกี่ยวกับการรีวิว
const financeRoutes = require('./routes/financeRoutes'); // API เกี่ยวกับการเงิน/โอนเงิน

// --- ใช้งาน ROUTERS ---
// สั่งให้เซิร์ฟเวอร์นำ API ทั้งหมดไปวางต่อท้ายคำว่า '/api' (เช่น /api/auth/firebase)
app.use('/api', authRoutes);
app.use('/api', maidRoutes);
app.use('/api', bookingRoutes);
app.use('/api', paymentRoutes);
app.use('/api', refundRoutes);
app.use('/api', cronRoutes);
app.use('/api', reviewRoutes);
app.use('/api', financeRoutes);

// --- เริ่มทำงาน Server ---
// สั่งให้เซิร์ฟเวอร์เริ่มต้นทำงาน (Listen) ที่พอร์ต 3001
app.listen(port, () => {
    // แสดงข้อความใน Terminal เพื่อให้รู้ว่าเซิร์ฟเวอร์รันสำเร็จแล้ว
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`KUCSC Clean Modular API is Ready`);
    
    // --- ระบบตรวจสอบอัตโนมัติ (Cron Jobs) ---
    // 1. ตรวจสอบการยกเลิกงานอัตโนมัติ (กรณีไม่จ่ายเงินในเวลาที่กำหนด)
    setInterval(() => {
        const http = require('http'); // ใช้ HTTP เรียก API ของตัวเอง
        // ยิง API ไปที่เส้นทางตรวจเช็คการจ่ายเงินหมดอายุ แบบ POST
        const req = http.request(`http://localhost:${port}/api/cron/check-expired-payments`, { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk); // รับข้อมูลกลับมา
            res.on('end', () => { // เมื่อรับครบแล้ว
                try {
                    const json = JSON.parse(data);
                    // ถ้ามีการยกเลิกเกิดขึ้น ให้แจ้งเตือนใน Console
                    if (json.cancelled_count > 0) {
                        console.log(`[AutoCancel] ${json.cancelled_count} bookings were cancelled due to payment timeout.`);
                    }
                } catch(e) {}
            });
        });
        req.on('error', (err) => null); // ซ่อน Error ถ้า API ล่มชั่วคราว
        req.end();
    }, 60000); // ตั้งเวลาให้ทำงานทุกๆ 60,000 มิลลิวินาที (1 นาที)

    // 2. ตรวจสอบการยกเลิกงานอัตโนมัติ (กรณีถึงเวลานัดแล้วแต่ไม่มีแม่บ้านรับงาน)
    setInterval(() => {
        const http = require('http');
        // ยิง API ไปที่เส้นทางเช็คงานที่ไม่มีใครรับ
        const req = http.request(`http://localhost:${port}/api/cron/check-no-maid-expiry`, { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.cancelled_count > 0) {
                        console.log(`⏱️ [NoMaidAutoCancel] ${json.cancelled_count} bookings were cancelled due to no maid accepted before appointment.`);
                    }
                } catch (e) {}
            });
        });
        req.on('error', (err) => null);
        req.end();
    }, 60000); // ทำงานทุกๆ 1 นาทีเช่นกัน
});