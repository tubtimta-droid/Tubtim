const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { notifyBookingUpdate } = require('../utils/notify');
const { generateId } = require('../utils/idGenerator');
const upload = require('../config/upload');

// ============================================================================
// [ADMIN] - จัดการการคืนเงิน
// ============================================================================
router.put('/bookings/:id/refund-complete', (req, res) => {
    const { status, admin_note } = req.body || {}; // status: 'refunded' | 'rejected'
    const bookingId = req.params.id;

    // ใช้ transaction: แก้ 2 ตารางพร้อมกัน ถ้าตารางไหนพังจะยกเลิกทั้งคู่ (rollback)
    db.getConnection((errConn, connection) => {
        if (errConn) return res.status(500).json({ error: errConn.message });

        connection.beginTransaction(errTx => {
            if (errTx) { connection.release(); return res.status(500).json({ error: errTx.message }); }

            // อนุมัติคืนเงิน → การจองถูกยกเลิก, ไม่อนุมัติ → งานกลับไปเป็น confirmed ทำต่อตามปกติ
            const newBookingStatus = status === 'refunded' ? 'cancelled' : 'confirmed';

            // 1. อัปเดตตารางหลัก (สถานะการจอง) — สถานะการคืนเงินจริงอยู่ใน booking_refunds
            const updateBookingSql = `UPDATE bookings SET status = ?, admin_note = ? WHERE booking_id = ?`;

            connection.query(updateBookingSql, [newBookingStatus, admin_note, bookingId], (e1) => {
                if (e1) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e1.message }); });

                // 2. อัปเดตตาราง Refund
                const updateRefundSql = `
                    UPDATE booking_refunds
                    SET status = ?,
                        admin_note = ?,
                        resolved_at = NOW()
                    WHERE booking_id = ?
                `;

                connection.query(updateRefundSql, [status, admin_note, bookingId], (e2) => {
                    if (e2) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e2.message }); });

                    // บันทึกจริง (commit) แล้วส่งอีเมลแจ้งลูกค้า
                    connection.commit(errCommit => {
                        if (errCommit) return connection.rollback(() => { connection.release(); res.status(500).json({ error: errCommit.message }); });
                        connection.release();
                        notifyBookingUpdate(bookingId, status === 'refunded' ? 'refund_completed' : 'rejected', { note: admin_note });
                        res.json({ success: true, status: status });
                    });
                });
            });
        });
    });
});

// ส่งคำขอคืนเงิน / แจ้งปัญหา 
router.post('/bookings/:id/refund-report', upload.array('evidences', 4), async (req, res) => {
    console.log('[DEBUG] POST /refund-report');
    console.log('[DEBUG] req.headers:', req.headers['content-type']);
    console.log('[DEBUG] req.body:', req.body);
    console.log('[DEBUG] req.files:', req.files);
    
    // ข้อมูลจากฟอร์มแจ้งปัญหา (ส่งแบบ form-data เพราะมีไฟล์รูปแนบ)
    const { user_id, reason_type, reason_text, bank_name, account_number, account_name } = req.body || {};
    const bookingId = req.params.id;
    
    // เก็บ path ของรูปหลักฐานทั้งหมดเป็นข้อความ JSON ในคอลัมน์ evidence_images
    let evidenceImages = null;
    if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(f => `/uploads/${f.filename}`);
        evidenceImages = JSON.stringify(filePaths);
    }
    
    // สถานะใหม่ตาม reason_type
    const statusMap = {
        'no_show': 'no_show_reported',
        'refund_request': 'refund_requested',
        'maid_no_contact': 'maid_reported',
        'maid_location_not_found': 'maid_reported',
        'maid_unsafe_site': 'maid_reported',
        'maid_sudden_cancel': 'maid_reported',
        'maid_other': 'maid_reported'
    };
    // ค่า reason_type ที่ไม่รู้จักต้องปฏิเสธ (ฐานข้อมูลไม่ได้เปิดโหมดเข้มงวด ค่าที่ผิดจะถูกเก็บเป็นค่าว่างเงียบๆ)
    if (!Object.prototype.hasOwnProperty.call(statusMap, reason_type)) {
        return res.status(400).json({ error: `reason_type ไม่ถูกต้อง ใช้ได้เฉพาะ: ${Object.keys(statusMap).join(', ')}` });
    }
    const newStatus = statusMap[reason_type];

    try {
        // ขอคืนเงินหลังงานเสร็จ: ต้องอยู่ภายใน 24 ชั่วโมงนับจาก completed_at (กันยิง API ตรงหลังปุ่มในแอปหาย)
        // ใช้เฉพาะ booking สถานะ completed เพราะ refund_request ยังใช้กับงานที่ถูกยกเลิกแล้วด้วย
        if (reason_type === 'refund_request') {
            const [bk] = await new Promise((resolve, reject) => {
                db.query('SELECT status, completed_at FROM bookings WHERE booking_id = ?', [bookingId], (err, rows) => err ? reject(err) : resolve(rows));
            });
            if (bk && bk.status === 'completed' && bk.completed_at
                && Date.now() - new Date(bk.completed_at).getTime() > 24 * 60 * 60 * 1000) {
                return res.status(400).json({ error: 'หมดเวลาขอคืนเงิน (ขอได้ภายใน 24 ชั่วโมงหลังงานเสร็จ)' });
            }
        }

        // กันส่งเรื่องซ้ำ: ถ้า booking นี้มีเรื่องที่ยังรอพิจารณาอยู่แล้ว ไม่สร้างเรื่องใหม่
        const [openRefund] = await new Promise((resolve, reject) => {
            db.query("SELECT refund_id FROM booking_refunds WHERE booking_id = ? AND status IN ('requested', 'investigating') LIMIT 1", [bookingId], (err, rows) => err ? reject(err) : resolve(rows));
        });
        if (openRefund) {
            return res.status(409).json({ error: 'รายการจองนี้มีเรื่องที่รอพิจารณาอยู่แล้ว', refund_id: openRefund.refund_id });
        }

        // สร้างรหัสเรื่องคืนเงินใหม่ เช่น R0004
        const refundId = await generateId('R', 'booking_refunds', 'refund_id');

        db.getConnection((errConn, connection) => {
            if (errConn) return res.status(500).json({ error: errConn.message });
            
            connection.beginTransaction(errTx => {
                if (errTx) { connection.release(); return res.status(500).json({ error: errTx.message }); }

                // 1. แทรกข้อมูลลงตารางคืนเงิน booking_refunds
                const refundSql = `
                    INSERT INTO booking_refunds (
                        refund_id, booking_id, reason_type, reason_text, reported_by, 
                        refund_bank_name, refund_account_number, refund_account_name, status, evidence_images
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?)
                `;
                connection.query(refundSql, [refundId, bookingId, reason_type, reason_text, user_id, bank_name, account_number, account_name, evidenceImages], (e1) => {
                    if (e1) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e1.message }); });

                    // 2. อัปเดตสถานะงานจอง
                    connection.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [newStatus, bookingId], (e2) => {
                        if (e2) return connection.rollback(() => { connection.release(); res.status(500).json({ error: e2.message }); });

                        connection.commit(errCommit => {
                            if (errCommit) return connection.rollback(() => { connection.release(); res.status(500).json({ error: errCommit.message }); });
                            connection.release();
                            notifyBookingUpdate(bookingId, 'dispute_created', { reason: reason_type });
                            res.json({ success: true, refund_id: refundId });
                        });
                    });
                });
            });
        });
    } catch (err) {
        console.error('[refund-report] error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// แอดมินตัดสินผลข้อพิพาท/คืนเงิน (Settle Dispute)
// body: status = 'refunded' (อนุมัติ) หรือ 'rejected' (ไม่อนุมัติ)
//       amount_to_user = เงินคืนลูกค้า, amount_to_maid = เงินชดเชยแม่บ้าน, admin_note = หมายเหตุ
router.put('/admin/refunds/:refundId/settle', (req, res) => {
    const { status: decision, amount_to_user, amount_to_maid, admin_note } = req.body || {}; // decision: 'refunded' หรือ 'rejected'
    const refundId = req.params.refundId;

    db.getConnection((errConn, connection) => {
        if (errConn) return res.status(500).json({ error: errConn.message });
        
        connection.beginTransaction(errTx => {
            if (errTx) { connection.release(); return res.status(500).json({ error: errTx.message }); }

            // 1. ดึงข้อมูลเคสคืนเงิน
            connection.query('SELECT * FROM booking_refunds WHERE refund_id = ?', [refundId], (e1, resR) => {
                if (e1 || resR.length === 0) return connection.rollback(() => { connection.release(); res.status(404).json({ error: 'Refund request not found' }); });
                
                const refund = resR[0];
                const bookingId = refund.booking_id;

                // กันตัดสินซ้ำ: ตัดสินได้เฉพาะเรื่องที่ยังรอพิจารณา ไม่งั้นยอดกระเป๋าแม่บ้านและอีเมลจะถูกทำซ้ำ
                if (!['requested', 'investigating'].includes(refund.status)) {
                    return connection.rollback(() => { connection.release(); res.status(400).json({ error: 'เรื่องนี้ถูกพิจารณาไปแล้ว ไม่สามารถตัดสินซ้ำได้' }); });
                }

                const fail = (err) => connection.rollback(() => { connection.release(); res.status(500).json({ error: err.message }); });

                // 2. ถ้าอนุมัติ (refunded)
                if (decision === 'refunded') {
                    // ก. อัปเดตตารางคืนเงิน
                    // customer_refund_status: ใช้ติดตามเฉพาะเคส "แม่บ้านแจ้งปัญหา" เท่านั้น เพราะกรณีนี้ไม่มีบัญชีลูกค้ามาก่อน
                    // ต้องรอลูกค้ากรอกทีหลัง ('waiting_bank_info' → 'ready' → แอดมินกดยืนยันโอน → 'paid')
                    // ส่วนเคสที่ลูกค้าแจ้งเอง บัญชีมีอยู่แล้วตั้งแต่ตอนส่งคำขอ ให้ถือว่าจบเคสทันทีที่ตัดสิน (NULL = ไม่ต้องมีปุ่ม/สถานะรอโอนเพิ่ม)
                    const isMaidReportedCase = (refund.reason_type || '').startsWith('maid_');
                    const customerRefundStatus = (isMaidReportedCase && Number(amount_to_user) > 0)
                        ? (refund.refund_bank_name ? 'ready' : 'waiting_bank_info')
                        : null;
                    connection.query('UPDATE booking_refunds SET status = "refunded", customer_refund_status = ?, refund_amount = ?, compensation_amount = ?, resolved_at = NOW(), admin_note = COALESCE(?, admin_note) WHERE refund_id = ?',
                    [customerRefundStatus, amount_to_user, amount_to_maid, admin_note || null, refundId], (e2) => {
                        if (e2) return fail(e2);

                        // ข. ถ้ามีการชดเชยให้แม่บ้าน (amount_to_maid > 0) ให้บวกเงินเข้า Wallet ทันที
                        const applyWalletAdjustment = (next) => {
                            if (amount_to_maid === 0) return next();
                            connection.query('SELECT maid_id FROM bookings WHERE booking_id = ?', [bookingId], (e3, resB) => {
                                if (e3) return fail(e3);
                                const maid_id = resB[0]?.maid_id;
                                if (!maid_id) return next();
                                connection.query('UPDATE maid_wallets SET wallet_balance = wallet_balance + ? WHERE maid_id = ?', [amount_to_maid, maid_id], (e4) => {
                                    if (e4) return fail(e4);
                                    next();
                                });
                            });
                        };

                        applyWalletAdjustment(() => {
                            // ค. ปิดงานจองให้เป็นสถานะยกเลิก
                            connection.query('UPDATE bookings SET status = "cancelled" WHERE booking_id = ?', [bookingId], (e5) => {
                                if (e5) return fail(e5);

                                connection.commit(errCommit => {
                                    if (errCommit) return fail(errCommit);
                                    connection.release();
                                    // เลือกอีเมลให้ตรงกับสถานะจริง ไม่ให้บอกว่า "โอนแล้ว" ทั้งที่ยังไม่ได้โอน หรือโอน 0 บาท
                                    let emailType = 'refund_completed';
                                    if (!(Number(amount_to_user) > 0)) emailType = 'dispute_resolved_no_refund';
                                    else if (customerRefundStatus === 'waiting_bank_info') emailType = 'refund_awaiting_bank_info';
                                    else if (customerRefundStatus === 'ready') emailType = 'refund_approved_pending_transfer';
                                    notifyBookingUpdate(bookingId, emailType, { amountToUser: amount_to_user, note: admin_note });
                                    res.json({ success: true, message: 'บันทึกการตัดสินและโอนเงินชดเชยเรียบร้อย' });
                                });
                            });
                        });
                    });
                } else {
                    // 3. ถ้าไม่อนุมัติ (rejected)
                    connection.query('UPDATE booking_refunds SET status = "rejected", resolved_at = NOW(), admin_note = COALESCE(?, admin_note) WHERE refund_id = ?', [admin_note || null, refundId], (e2) => {
                        if (e2) return fail(e2);
                        // คืนสถานะเดิมของงาน: ถ้างานเสร็จแล้ว (มี completed_at) ต้องกลับเป็น completed ไม่ใช่ confirmed
                        connection.query('UPDATE bookings SET status = CASE WHEN completed_at IS NOT NULL THEN "completed" ELSE "confirmed" END WHERE booking_id = ?', [bookingId], (e3) => {
                            if (e3) return fail(e3);
                            connection.commit(errCommit => {
                                if (errCommit) return fail(errCommit);
                                connection.release();
                                notifyBookingUpdate(bookingId, 'dispute_rejected', {
                                    note: admin_note,
                                    isMaidReport: (refund.reason_type || '').startsWith('maid_'),
                                });
                                res.json({ success: true, message: 'ปฏิเสธคำร้องเรียบร้อย' });
                            });
                        });
                    });
                }
            });
        });
    });
});

// ลูกค้าส่งข้อมูลบัญชีธนาคารเพื่อรับเงินคืน (กรณีแม่บ้านแจ้งปัญหา ไม่มีบัญชีลูกค้ามาก่อนตอนตัดสิน)
// ตรวจสิทธิ์: ต้องเป็นเจ้าของการจองเท่านั้นจึงกรอกบัญชีได้ แล้วเปลี่ยนสถานะเงินคืนเป็น ready (พร้อมโอน)
router.put('/bookings/:id/refund-bank-info', (req, res) => {
    const { user_id, bank_name, account_number, account_name } = req.body || {};
    const bookingId = req.params.id;

    if (!bank_name || !account_number || !account_name) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลบัญชีให้ครบถ้วน' });
    }

    db.query('SELECT user_id FROM bookings WHERE booking_id = ?', [bookingId], (errB, resB) => {
        if (errB) return res.status(500).json({ error: errB.message });
        if (resB.length === 0) return res.status(404).json({ error: 'ไม่พบรายการจองนี้' });
        if (resB[0].user_id !== user_id) return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไขรายการนี้' });

        const sql = `
            UPDATE booking_refunds
            SET refund_bank_name = ?, refund_account_number = ?, refund_account_name = ?, customer_refund_status = 'ready'
            WHERE booking_id = ? AND customer_refund_status = 'waiting_bank_info'
            ORDER BY reported_at DESC LIMIT 1
        `;
        db.query(sql, [bank_name, account_number, account_name, bookingId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!result.affectedRows) return res.status(400).json({ error: 'ไม่พบรายการที่รอข้อมูลบัญชีสำหรับการจองนี้' });

            db.query('SELECT refund_amount FROM booking_refunds WHERE booking_id = ? AND customer_refund_status = "ready" ORDER BY reported_at DESC LIMIT 1', [bookingId], (errR, resR) => {
                notifyBookingUpdate(bookingId, 'refund_bank_info_submitted', {
                    bankName: bank_name,
                    accountNumber: account_number,
                    accountName: account_name,
                    amountToUser: !errR && resR.length > 0 ? resR[0].refund_amount : undefined,
                });
                res.json({ success: true });
            });
        });
    });
});

// แอดมินกดยืนยันว่าโอนเงินคืนลูกค้าจริงแล้ว (ปิดเคสสุดท้าย) — เรียกจากการ์ดการจองในหน้ารายการจองโดยตรง
// เปลี่ยนสถานะเงินคืนจาก ready → paid ได้ครั้งเดียว (กันกดยืนยันซ้ำ)
router.put('/admin/refunds/:refundId/mark-paid', (req, res) => {
    const refundId = req.params.refundId;

    db.query('SELECT booking_id, refund_amount FROM booking_refunds WHERE refund_id = ? AND customer_refund_status = "ready"', [refundId], (errSel, resSel) => {
        if (errSel) return res.status(500).json({ error: errSel.message });
        if (resSel.length === 0) return res.status(400).json({ error: 'รายการนี้ยังไม่พร้อมโอน หรือโอนไปแล้ว' });
        const { booking_id, refund_amount } = resSel[0];

        db.query(
            "UPDATE booking_refunds SET customer_refund_status = 'paid' WHERE refund_id = ? AND customer_refund_status = 'ready'",
            [refundId],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!result.affectedRows) return res.status(400).json({ error: 'รายการนี้ยังไม่พร้อมโอน หรือโอนไปแล้ว' });
                notifyBookingUpdate(booking_id, 'refund_paid', { amountToUser: refund_amount });
                res.json({ success: true });
            }
        );
    });
});

module.exports = router;
