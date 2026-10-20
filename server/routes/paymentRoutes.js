const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/upload');
const { notifyBookingUpdate } = require('../utils/notify');

// แจ้งชำระเงิน (อัปโหลดสลิป)
router.post('/bookings/:id/pay', upload.single('slip'), (req, res) => {
    // upload.single('slip') บันทึกไฟล์สลิปลงโฟลเดอร์ uploads ให้ก่อน แล้วเก็บ path ลงฐานข้อมูล
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const slipPath = `/uploads/${req.file.filename}`;
    
    // อัปเดตตารางการชำระเงิน booking_payments
    const updatePaymentSql = `
        UPDATE booking_payments 
        SET payment_slip = ?, 
            payment_status = "waiting_verify",
            paid_at = NOW()
        WHERE booking_id = ?
    `;

    db.query(updatePaymentSql, [slipPath, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        notifyBookingUpdate(req.params.id, 'paid');
        return res.json({ success: true });
    });
});

// อนุมัติสลิป (แอดมิน)
router.put('/bookings/:id/confirm-payment', (req, res) => {
    const bookingId = req.params.id;
    // 1) ตั้งสถานะการชำระเงินเป็น paid และล้างหมายเหตุการปฏิเสธเดิม
    db.query('UPDATE booking_payments SET payment_status = "paid", approved_by_admin_note = NULL WHERE booking_id = ?', [bookingId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // 2) ยืนยันคิวงาน: เปลี่ยนสถานะการจองเป็น confirmed แล้วส่งอีเมลแจ้งลูกค้า
        db.query('UPDATE bookings SET status = "confirmed" WHERE booking_id = ?', [bookingId], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            notifyBookingUpdate(bookingId, 'approved');
            res.json({ success: true });
        });
    });
});

// ปฏิเสธสลิป
router.put('/bookings/:id/reject-payment', (req, res) => {
    const { note } = req.body || {};
    // เวลาแก้สลิป = 30 นาที แต่ไม่เกินเวลาที่เหลือก่อนงานถูกยกเลิก (2 ชั่วโมงก่อนเริ่มงาน)
    // เช่น เหลืออีก 20 นาทีก่อนยกเลิก จะได้เวลา 20 นาที
    // แต่ต้องได้อย่างน้อย 10 นาทีเสมอ แม้เลยจุดยกเลิกไปแล้ว (เช่น ลูกค้าแนบสลิปทันแต่แอดมินตรวจช้า) ลูกค้าจะได้ไม่เสียงานเพราะความล่าช้าของฝั่งแอดมิน
    const rejectSql = `
        UPDATE booking_payments p
        JOIN bookings b ON b.booking_id = p.booking_id
        SET p.payment_status = 'rejected',
            p.approved_by_admin_note = ?,
            p.payment_deadline = GREATEST(
                DATE_ADD(NOW(), INTERVAL 10 MINUTE),
                LEAST(
                    DATE_ADD(NOW(), INTERVAL 30 MINUTE),
                    COALESCE(DATE_SUB(b.booking_date, INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 30 MINUTE))
                )
            )
        WHERE p.booking_id = ?
    `;
    db.query(rejectSql, [note, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // ซิงค์ข้อมูลกลับไปที่ตาราง bookings (frontend เช็คจาก b.admin_note)
        db.query('UPDATE bookings SET admin_note = ? WHERE booking_id = ?', [note, req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            notifyBookingUpdate(req.params.id, 'rejected', { note });
            return res.json({ success: true });
        });
    });
});

module.exports = router;
