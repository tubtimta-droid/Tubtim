// นำเข้าไลบรารี firebase-admin เพื่อให้เซิร์ฟเวอร์หลังบ้านจัดการระบบสมาชิกได้
const admin = require('firebase-admin');

// นำเข้าไฟล์ "กุญแจลับ" (Service Account Key) ที่ได้มาจาก Firebase Console
// ไฟล์นี้เปรียบเสมือนบัตรประชาชนของเซิร์ฟเวอร์ เพื่อยืนยันตัวตนกับ Google
const serviceAccount = require('./serviceAccountKey.json');

// เริ่มต้นระบบ Firebase Admin ด้วยกุญแจลับ
// การทำแบบนี้จะทำให้เซิร์ฟเวอร์มีสิทธิ์พิเศษ (Admin Privileges) ในการตรวจสอบ Token ของผู้ใช้
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// ส่งออกตัวแปร admin เพื่อให้ไฟล์อื่นๆ (เช่น authRoutes.js) นำไปใช้ตรวจสอบ ID Token ได้
module.exports = admin;
