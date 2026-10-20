const mysql = require('mysql2');

// ข้อมูลสำหรับเข้าฐานข้อมูล (XAMPP ค่าเริ่มต้น: user root ไม่มีรหัสผ่าน)
const DB_PASSWORD = ''; // ใส่รหัสผ่าน DB (ถ้ามี)
const DB_USER = 'root'; 
const DB_NAME = 'ku_maid_db';

// Connection Pool = กลุ่มการเชื่อมต่อที่เปิดค้างไว้ใช้ซ้ำ ไม่ต้องเปิด-ปิดใหม่ทุกครั้งที่ query
// connectionLimit: 10 = เปิดพร้อมกันได้สูงสุด 10 การเชื่อมต่อ ที่เหลือรอคิว (waitForConnections)
const db = mysql.createPool({ 
    host: 'localhost', 
    user: DB_USER, 
    password: DB_PASSWORD, 
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบเชื่อมต่อ 1 ครั้งตอนเปิด server แล้วแสดงผลใน terminal จากนั้นคืนการเชื่อมต่อกลับเข้า pool
db.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
        conn.release();
    }
});

// ส่งออก pool ให้ไฟล์อื่น require('../config/db') ไปใช้
module.exports = db;