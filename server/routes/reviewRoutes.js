const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { generateId } = require('../utils/idGenerator');

const MAX_REVIEW_LENGTH = 1000;

router.post('/user/bookings/:id/review', async (req, res) => {
    const bookingId = req.params.id;
    const { rating, review } = req.body || {};

    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return res.status(400).json({ error: 'rating ต้องเป็นจำนวนเต็ม 1-5' });
    }
    const reviewText = review ? String(review).trim().slice(0, MAX_REVIEW_LENGTH) : null;

    let conn;
    try {
        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        const [bookings] = await conn.query('SELECT maid_id FROM bookings WHERE booking_id = ?', [bookingId]);
        if (bookings.length === 0) throw { http: 404, message: 'ไม่พบรายการจองนี้' };

        // สร้างรหัสรีวิวแบบ V0001, V0002, ... (รูปแบบเดียวกับรหัสการจอง)
        const reviewId = await generateId('V', 'booking_reviews', 'review_id');

        // ถ้ารีวิวไปแล้ว ฐานข้อมูลจะปฏิเสธ (ER_DUP_ENTRY) แล้วไปตอบ 409 ในส่วน catch
        await conn.query(
            'INSERT INTO booking_reviews (review_id, booking_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [reviewId, bookingId, stars, reviewText]
        );

        // อัปเดตคะแนนเฉลี่ยและจำนวนรีวิวของแม่บ้านใน maid_stats
        const maidId = bookings[0].maid_id;
        if (maidId) {
            const [[stat]] = await conn.query(
                `SELECT COUNT(*) AS total_reviews, AVG(br.rating) AS average_rating
                 FROM booking_reviews br JOIN bookings b ON br.booking_id = b.booking_id
                 WHERE b.maid_id = ?`,
                [maidId]
            );
            await conn.query(
                `INSERT INTO maid_stats (maid_id, average_rating, total_reviews, completed_jobs) VALUES (?, ?, ?, 0)
                 ON DUPLICATE KEY UPDATE average_rating = VALUES(average_rating), total_reviews = VALUES(total_reviews)`,
                [maidId, stat.average_rating, stat.total_reviews]
            );
        }

        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        if (conn) { try { await conn.rollback(); } catch (_) { /* ignore */ } }
        if (err && err.http) return res.status(err.http).json({ error: err.message });
        if (err && err.code === 'ER_DUP_ENTRY') {
            // ซ้ำได้สองแบบ: (1) การจองนี้รีวิวไปแล้ว  (2) สองคำขอสร้างรหัสรีวิวเลขเดียวกันพร้อมกัน — แยกด้วยการเช็กว่าการจองนี้มีรีวิวแล้วหรือยัง
            const [done] = await db.promise().query('SELECT 1 FROM booking_reviews WHERE booking_id = ? LIMIT 1', [bookingId]);
            if (done.length > 0) return res.status(409).json({ error: 'รายการจองนี้ให้คะแนนไปแล้ว (รีวิวได้ครั้งเดียวต่อการจอง)' });
            return res.status(503).json({ error: 'ระบบกำลังประมวลผล กรุณาลองส่งรีวิวอีกครั้ง' });
        }
        console.error('Submit review error:', err);
        return res.status(500).json({ error: 'ส่งรีวิวไม่สำเร็จ' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
