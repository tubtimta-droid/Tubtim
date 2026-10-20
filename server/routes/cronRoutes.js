const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { notifyBookingUpdate } = require('../utils/notify');

// ============================================================================
// ✨ API ตรวจสอบและยกเลิกงานที่หมดเวลาจ่ายเงิน (ป้องกันบัคอีเมลส่งรัวๆ)
// กติกา: จ่ายภายใน 30 นาที (payment_deadline) แต่ไม่เกินเวลายกเลิกงาน = 2 ชั่วโมงก่อนเริ่มงาน
// (ตอนตั้ง payment_deadline ระบบตัดเพดานด้วยเวลานี้แล้ว เงื่อนไข booking_date ด้านล่างเป็นตัวกันสำรอง
//  ใช้เฉพาะงานที่ยังไม่เคยแนบสลิป — สลิปที่ถูกปฏิเสธต้องยึด payment_deadline ซึ่งมีเวลาขั้นต่ำให้แก้ไข)
// ============================================================================
let isCheckingCron = false; // ตัวแปรล็อกป้องกันการทำงานซ้อนกัน (Race condition)

router.post('/cron/check-expired-payments', (req, res) => {
    if (isCheckingCron) return res.json({ success: true, message: 'Already processing' });
    isCheckingCron = true;

    // หางานที่รอชำระเงิน แต่เลยกำหนดเวลาจ่าย หรือใกล้เวลานัดเกิน 2 ชม. แล้วยังไม่จ่าย
    const now = new Date();
    const sql = `
        SELECT b.booking_id, p.payment_status
        FROM bookings b
        JOIN booking_payments p ON b.booking_id = p.booking_id
        WHERE b.status = 'waiting_payment' 
          AND p.payment_status IN ('unpaid', 'rejected')
          AND (
              p.payment_deadline < ? 
              OR (p.payment_status = 'unpaid' AND b.booking_date IS NOT NULL AND b.booking_date <= DATE_ADD(NOW(), INTERVAL 2 HOUR))
          )
    `;
    
    db.query(sql, [now], (err, results) => {
        if (err || results.length === 0) {
            isCheckingCron = false; 
            return res.json({ success: true, cancelled_count: 0 });
        }

        const expiredIds = results.map(r => r.booking_id);
        const cancelReason = 'ระบบยกเลิกอัตโนมัติ: หมดเวลาชำระเงิน หรือ ไม่ได้แก้ไขสลิปให้ถูกต้องภายในเวลาที่กำหนด';
        
        // 3NF: ยกเลิกทั้งในตารางหลักและการชำระเงิน
        db.query(`UPDATE booking_payments SET payment_status = 'expired' WHERE booking_id IN (?)`, [expiredIds], () => {
            db.query(`UPDATE bookings SET status = 'cancelled_by_timeout', cancel_reason = ? WHERE booking_id IN (?)`, [cancelReason, expiredIds], (err2, updateResult) => {
                if (!err2 && updateResult.affectedRows > 0) {
                    expiredIds.forEach(id => notifyBookingUpdate(id, 'cancelled', { note: cancelReason }));
                }
                isCheckingCron = false; 
                res.json({ success: true, cancelled_count: expiredIds.length });
            });
        });
    });
});

// ============================================================================
// ✨ API ตรวจสอบและยกเลิกงานที่ยังไม่มีพนักงานรับก่อนเวลานัด 2 ชั่วโมง
// ============================================================================
let isCheckingNoMaidCron = false; // ล็อกสำหรับงานรอพนักงานรับงาน

router.post('/cron/check-no-maid-expiry', (req, res) => {
    if (isCheckingNoMaidCron) return res.json({ success: true, message: 'Already processing' });
    isCheckingNoMaidCron = true;

    // หางานที่ยังรอแม่บ้านรับ และเหลือเวลาไม่ถึง 2 ชม. ก่อนเวลานัด
    const sql = `
        SELECT booking_id
        FROM bookings
        WHERE status = 'waiting_maid'
          AND booking_date IS NOT NULL
          AND booking_date <= DATE_ADD(NOW(), INTERVAL 2 HOUR)
    `;

    db.query(sql, (err, results) => {
        if (err || results.length === 0) {
            isCheckingNoMaidCron = false;
            return res.json({ success: true, cancelled_count: 0 });
        }

        const expiredIds = results.map(r => r.booking_id);
        const cancelNote = 'ระบบยกเลิกอัตโนมัติ: ไม่มีพนักงานรับงานก่อนเวลาเริ่มงาน 2 ชั่วโมง';

        db.query(
            `UPDATE bookings
             SET status = 'cancelled_no_maid', cancel_reason = ?
             WHERE booking_id IN (?) AND status = 'waiting_maid'`,
            [cancelNote, expiredIds],
            (err2, updateResult) => {
                if (!err2 && updateResult.affectedRows > 0) {
                    expiredIds.forEach(id => {
                        notifyBookingUpdate(id, 'cancelled', {
                            note: 'ขออภัย ขณะนี้ยังไม่มีพนักงานรับงานของคุณ ระบบจึงยกเลิกคิวอัตโนมัติ และคุณสามารถกดจองใหม่ได้ทันที'
                        });
                    });
                }

                isCheckingNoMaidCron = false;
                res.json({ success: true, cancelled_count: updateResult?.affectedRows || 0 });
            }
        );
    });
});

module.exports = router;
