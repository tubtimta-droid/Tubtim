const nodemailer = require('nodemailer');

// อีเมลผู้ส่ง: ลองอ่านจากชื่อตัวแปรหลายแบบใน .env ตัวไหนมีก่อนใช้ตัวนั้น
const SMTP_USER =
    process.env.SMTP_USER ||
    process.env.SENDER_EMAIL ||
    process.env.GMAIL_USER ||
    null;

// รหัสผ่านแอป (App Password) ของ Gmail — ไม่ใช่รหัสผ่านปกติของบัญชี
const SMTP_PASS =
    process.env.SMTP_PASS ||
    process.env.SENDER_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    null;

// ผู้ให้บริการอีเมล (ค่าเริ่มต้น gmail) และอีเมลแอดมินที่จะรับแจ้งเตือน
const SMTP_SERVICE = process.env.SMTP_SERVICE || 'gmail';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SMTP_USER || null;

// transporter = ตัวส่งอีเมล สร้างเฉพาะเมื่อมีบัญชีผู้ส่งครบ (ถ้าไม่ตั้งค่า ระบบจะข้ามการส่งอีเมล ไม่ error)
let transporter = null;
if (SMTP_USER && SMTP_PASS) {
    // App Password ของ Gmail มักคัดลอกมาพร้อมช่องว่าง จึงลบช่องว่างออกก่อนใช้
    const cleanedPass = SMTP_PASS.replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
        service: SMTP_SERVICE,
        auth: { user: SMTP_USER, pass: cleanedPass }
    });

    // ทดสอบเชื่อมต่อ SMTP ตอนเปิด server แล้วแสดงผลใน terminal
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ [email] SMTP Connection failed:', error.message);
        } else {
            console.log('✅ [email] SMTP Server is ready to send messages');
        }
    });
}

// sendEmail(ผู้รับ, หัวเรื่อง, เนื้อหาแบบ HTML)
// ส่งแบบไม่รอผล (ไม่ทำให้ API ช้า) ถ้าไม่มีผู้รับหรือยังไม่ตั้งค่า SMTP จะข้ามไปเฉย ๆ
const sendEmail = (to, subject, htmlContent) => {
    if (!to) return;
    if (!transporter) {
        console.warn(`[email] skip "${subject}" - SMTP not configured`);
        return;
    }
    transporter.sendMail(
        {
            from: `"KUCSC Clean" <${SMTP_USER}>`,
            to,
            subject,
            html: htmlContent
        },
        (error) => {
            if (error) console.error('❌ Error sending email:', error.message);
        }
    );
};

// ส่งออกฟังก์ชันส่งอีเมล และอีเมลแอดมิน ให้ utils/notify.js ใช้
module.exports = { sendEmail, ADMIN_EMAIL };

