const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function seedPhotos() {
    try {
        // ตรวจว่ามีโฟลเดอร์ uploads และมีรูปภาพให้สุ่มใช้
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            console.log('No uploads folder found.');
            process.exit(1);
        }

        const files = fs.readdirSync(uploadDir).filter(f => f.match(/\.(png|jpe?g)$/i));
        if (files.length === 0) {
            console.log('No images found in uploads folder.');
            process.exit(1);
        }

        // แปลง db.query แบบ callback ให้เป็น Promise จะได้ใช้ await ได้
        const dbQuery = (sql, params) => new Promise((resolve, reject) => {
            db.query(sql, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // 1. หาการจองที่เสร็จแล้วแต่ยังไม่มีรูปผลงาน
        const sql = `
            SELECT b.booking_id, sz.zone_name
            FROM bookings b
            JOIN booking_services bs ON b.booking_id = bs.booking_id
            JOIN service_zones sz ON bs.service_zone_id = sz.zone_id
            WHERE b.status = 'completed'
            AND b.booking_id NOT IN (SELECT DISTINCT booking_id FROM job_photos)
        `;
        const bookings = await dbQuery(sql);

        if (bookings.length === 0) {
            console.log('No completed bookings without photos found.');
            process.exit(0);
        }

        // หาเลข photo_id ล่าสุด
        // หาเลขรหัสรูปล่าสุด (P0001, P0002, ...) เพื่อรันเลขต่อ
        const photoRes = await dbQuery('SELECT MAX(CAST(SUBSTRING(photo_id, 2) AS UNSIGNED)) as maxId FROM job_photos');
        let currentId = photoRes[0].maxId || 0;

        let inserted = 0;
        for (const b of bookings) {
            // เพิ่มรูปงานละ 4 รูป
            for (let i = 0; i < 4; i++) {
                currentId++;
                const newPhotoId = 'P' + String(currentId).padStart(4, '0');
                const randomFile = files[Math.floor(Math.random() * files.length)];
                const photoPath = '/uploads/' + randomFile;
                const photoType = i < 2 ? 'before' : 'after';

                await dbQuery(
                    'INSERT INTO job_photos (photo_id, booking_id, service_zone, photo_type, photo_path) VALUES (?, ?, ?, ?, ?)',
                    [newPhotoId, b.booking_id, b.zone_name, photoType, photoPath]
                );
                inserted++;
            }
        }

        // สรุปผลแล้วจบโปรแกรม
        console.log(`Successfully added ${inserted} photos to ${bookings.length} booking zones.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seedPhotos();
