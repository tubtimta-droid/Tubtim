const multer = require('multer');
const path = require('path');
const fs = require('fs');

// บอก multer ว่าจะเก็บไฟล์ที่ไหน และตั้งชื่อไฟล์ยังไง
const storage = multer.diskStorage({
    // destination: โฟลเดอร์ปลายทาง ถ้ายังไม่มีโฟลเดอร์ uploads ให้สร้างใหม่
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    // filename: ตั้งชื่อใหม่เป็น file_<เวลา>_<เลขสุ่ม>.<นามสกุลเดิม> กันชื่อซ้ำ/ทับไฟล์เดิม
    filename: (req, file, cb) => {
        cb(null, `file_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

// สร้างตัวรับไฟล์จากการตั้งค่าข้างบน แล้วส่งออกให้ routes ใช้เป็น middleware
const upload = multer({ storage: storage });

module.exports = upload;