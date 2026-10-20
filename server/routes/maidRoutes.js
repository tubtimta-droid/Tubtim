const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const upload = require('../config/upload');
const { generateId, generateBulkIds } = require('../utils/idGenerator');
const { notifyBookingUpdate } = require('../utils/notify');

// ================= แอดมินจัดการแม่บ้าน =================
router.get('/maids', (req, res) => {
    // query: online_only=true → เฉพาะแม่บ้านที่ออนไลน์อยู่
    //        all=true         → รวมแม่บ้านที่ไม่ active ด้วย (ค่าปกติแสดงเฉพาะ active)
    const { online_only, all } = req.query;
    // ดึงแม่บ้านพร้อมสถิติ (คะแนนเฉลี่ย, จำนวนรีวิว, จำนวนงานที่ทำเสร็จ) จากตาราง maid_stats
    let sql = `
        SELECT m.*, ms.average_rating, ms.total_reviews, ms.completed_jobs as total_jobs
        FROM maids m
        LEFT JOIN maid_stats ms ON m.maid_id = ms.maid_id
    `;
    let conditions = [];
    if (online_only === 'true') conditions.push('m.is_online = 1');
    if (all !== 'true') conditions.push('m.status = "active"');
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    // เรียงคนคะแนนดีที่สุดขึ้นก่อน
    sql += ' ORDER BY ms.average_rating DESC, ms.total_reviews DESC, m.first_name ASC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// รูปผลงาน (ลูกค้าดู before/after ในหน้าประวัติการจอง)
router.get('/maid/job-photos/:bookingId', (req, res) => {
    db.query('SELECT * FROM job_photos WHERE booking_id = ? ORDER BY created_at ASC', [req.params.bookingId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ================= แม่บ้านรับงาน (accept) =================
// ตั้งเวลาชำระเงิน 30 นาที (ไม่เกินจุดยกเลิก = 2 ชั่วโมงก่อนเริ่มงาน) และส่งอีเมลแจ้งลูกค้าให้ชำระเงิน
router.put('/maid/jobs/:bookingId/accept', async (req, res) => {
    const bookingId = req.params.bookingId;
    const maidId = req.body && req.body.maid_id;
    if (!maidId) return res.status(400).json({ success: false, error: 'กรุณาระบุ maid_id (รหัสแม่บ้านที่รับงาน)' });

    let conn;
    try {
        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        const [maids] = await conn.query('SELECT status FROM maids WHERE maid_id = ?', [maidId]);
        if (maids.length === 0) throw { http: 404, message: 'ไม่พบแม่บ้านรหัสนี้' };
        if (maids[0].status !== 'active') throw { http: 400, message: 'แม่บ้านคนนี้ไม่ได้อยู่ในสถานะใช้งาน จึงรับงานไม่ได้' };

        // ล็อกแถวงานกันสองคนกดรับพร้อมกัน
        const [rows] = await conn.query('SELECT status, maid_id FROM bookings WHERE booking_id = ? FOR UPDATE', [bookingId]);
        if (rows.length === 0) throw { http: 404, message: 'ไม่พบรายการจองนี้' };
        const job = rows[0];

        if (job.maid_id) {
            throw { http: 400, message: job.maid_id === maidId
                ? 'คุณรับงานนี้ไปแล้ว'
                : `งานนี้มีแม่บ้านรับไปแล้ว (${job.maid_id})` };
        }
        if (job.status !== 'waiting_maid') {
            throw { http: 400, message: `ไม่สามารถรับงานได้ เพราะรายการนี้อยู่ในสถานะ "${job.status}" (รับได้เฉพาะงานที่รอแม่บ้านรับ)` };
        }

        await conn.query(
            "UPDATE bookings SET maid_id = ?, status = 'waiting_payment', maid_status = 'accepted', accepted_at = NOW() WHERE booking_id = ?",
            [maidId, bookingId]
        );
        // เวลาจ่าย = 30 นาที แต่ไม่เกินเวลายกเลิกงาน (2 ชั่วโมงก่อนเริ่มงาน)
        await conn.query(
            `UPDATE booking_payments p
             JOIN bookings b ON b.booking_id = p.booking_id
             SET p.payment_status = 'unpaid',
                 p.payment_slip = NULL,
                 p.paid_at = NULL,
                 p.payment_deadline = LEAST(
                     DATE_ADD(NOW(), INTERVAL 30 MINUTE),
                     COALESCE(DATE_SUB(b.booking_date, INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 30 MINUTE))
                 )
             WHERE p.booking_id = ?`,
            [bookingId]
        );

        await conn.commit();
        notifyBookingUpdate(bookingId, 'accepted');
        return res.json({ success: true, booking_id: bookingId, status: 'waiting_payment', maid_id: maidId });
    } catch (err) {
        if (conn) { try { await conn.rollback(); } catch (_) { /* ignore */ } }
        if (err && err.http) return res.status(err.http).json({ success: false, error: err.message });
        console.error('Accept job error:', err);
        return res.status(500).json({ success: false, error: (err && err.message) || 'เกิดข้อผิดพลาดในการรับงาน' });
    } finally {
        if (conn) conn.release();
    }
});

// ================= แม่บ้านเริ่มให้บริการ (in_progress) =================
// เปลี่ยนสถานะ confirmed -> in_progress และบันทึกเวลาเริ่มงาน (job_started_at) พร้อมส่งอีเมลแจ้งลูกค้า
router.put('/maid/jobs/:bookingId/start', async (req, res) => {
    const bookingId = req.params.bookingId;
    const maidId = req.body && req.body.maid_id;
    if (!maidId) return res.status(400).json({ success: false, error: 'กรุณาระบุ maid_id (รหัสแม่บ้านที่เริ่มงาน)' });

    try {
        const [rows] = await db.promise().query(
            `SELECT b.status, b.maid_id, p.payment_status
             FROM bookings b JOIN booking_payments p ON p.booking_id = b.booking_id
             WHERE b.booking_id = ?`,
            [bookingId]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบรายการจองนี้' });
        const job = rows[0];

        if (job.maid_id !== maidId) return res.status(403).json({ success: false, error: 'งานนี้ไม่ได้รับมอบหมายให้แม่บ้านคนนี้' });
        if (job.status === 'in_progress') return res.status(400).json({ success: false, error: 'งานนี้เริ่มให้บริการไปแล้ว' });
        if (job.status !== 'confirmed') {
            return res.status(400).json({ success: false, error: `ไม่สามารถเริ่มงานได้ เพราะรายการนี้อยู่ในสถานะ "${job.status}" (เริ่มได้เฉพาะงานที่ยืนยันแล้ว)` });
        }
        if (job.payment_status !== 'paid') return res.status(400).json({ success: false, error: 'ไม่สามารถเริ่มงานได้ เพราะลูกค้ายังไม่ได้ชำระเงิน' });

        // เงื่อนไข status = 'confirmed' ซ้ำใน WHERE กันกดเริ่มพร้อมกันสองครั้ง (ส่งอีเมลซ้ำ)
        const [result] = await db.promise().query(
            "UPDATE bookings SET status = 'in_progress', job_started_at = NOW() WHERE booking_id = ? AND status = 'confirmed'",
            [bookingId]
        );
        if (result.affectedRows === 0) return res.status(400).json({ success: false, error: 'งานนี้ถูกเปลี่ยนสถานะไปแล้ว กรุณาตรวจสอบอีกครั้ง' });

        notifyBookingUpdate(bookingId, 'job_started');
        return res.json({ success: true, booking_id: bookingId, status: 'in_progress' });
    } catch (err) {
        console.error('Start job error:', err);
        return res.status(500).json({ success: false, error: err.message || 'เกิดข้อผิดพลาดในการเริ่มงาน' });
    }
});

// ================= แม่บ้านปิดงาน (เสร็จงาน) =================
// ต้องแนบรูปหลักฐานก่อนทำงาน (before) และหลังทำงาน (after) "ของทุกบริการที่ลูกค้าจอง" อย่างน้อยอย่างละ 2 รูป ไม่เกินอย่างละ 3 รูป
const MIN_PHOTOS_PER_TYPE = 2; // ต่อบริการ ต่อประเภท (before/after)
const MAX_PHOTOS_PER_TYPE = 3;

const receiveJobPhotos = (req, res, next) => {
    upload.any()(req, res, (err) => {
        if (!err) return next();
        return res.status(400).json({ success: false, error: err.message });
    });
};

router.put('/maid/jobs/:bookingId/complete', receiveJobPhotos, async (req, res) => {
    const bookingId = req.params.bookingId;
    const files = Array.isArray(req.files) ? req.files : [];
    const removeUploadedFiles = () => files.forEach((f) => fs.unlink(f.path, () => {}));
    const reject = (status, error) => {
        removeUploadedFiles();
        return res.status(status).json({ success: false, error });
    };

    const maidId = req.body && req.body.maid_id;
    if (!maidId) return reject(400, 'กรุณาระบุ maid_id (รหัสแม่บ้านที่ปิดงาน)');

    let conn;
    try {
        conn = await db.promise().getConnection();
        await conn.beginTransaction();

        // ล็อกแถวงานไว้ระหว่างทำ กันปิดงานซ้ำพร้อมกันสองครั้งแล้วเงินเข้าสองรอบ
        const [rows] = await conn.query(
            `SELECT b.booking_id, b.status, b.maid_id, p.total_price, p.payment_status
             FROM bookings b
             JOIN booking_payments p ON p.booking_id = b.booking_id
             WHERE b.booking_id = ? FOR UPDATE`,
            [bookingId]
        );
        if (rows.length === 0) throw { http: 404, message: 'ไม่พบรายการจองนี้' };
        const job = rows[0];

        if (job.maid_id !== maidId) throw { http: 403, message: 'งานนี้ไม่ได้รับมอบหมายให้แม่บ้านคนนี้' };
        if (job.status === 'completed') throw { http: 400, message: 'งานนี้ปิดไปแล้ว ไม่สามารถปิดซ้ำได้' };
        if (!['confirmed', 'in_progress'].includes(job.status)) {
            throw { http: 400, message: `ไม่สามารถปิดงานได้ เพราะรายการนี้อยู่ในสถานะ "${job.status}" (ปิดได้เฉพาะงานที่ยืนยันแล้ว)` };
        }
        if (job.payment_status !== 'paid') throw { http: 400, message: 'ไม่สามารถปิดงานได้ เพราะลูกค้ายังไม่ได้ชำระเงิน' };

        const amount = Number(job.total_price);
        if (!(amount > 0)) throw { http: 400, message: 'ไม่พบราคาที่ลูกค้าจองไว้ ไม่สามารถโอนเงินเข้า Wallet ได้' };

        // ---- ตรวจรูปหลักฐานตามบริการที่ลูกค้าจอง ----
        const [zoneRows] = await conn.query(
            `SELECT bs.service_zone_id AS zone_id, COALESCE(sz.zone_name, bs.service_zone_id) AS zone_name
             FROM booking_services bs
             LEFT JOIN service_zones sz ON sz.zone_id = bs.service_zone_id
             WHERE bs.booking_id = ? ORDER BY bs.service_id`,
            [bookingId]
        );
        // งานเก่าที่ไม่มีรายการบริการ: ใช้ฟิลด์ before/after ธรรมดา และไม่ระบุโซน
        const zones = zoneRows.length > 0 ? zoneRows : [{ zone_id: null, zone_name: null }];
        const needsZoneInFieldName = zones.length > 1;

        const fieldHelp = zones
            .map((z) => needsZoneInFieldName
                ? `before_${z.zone_id}, after_${z.zone_id} (${z.zone_name})`
                : 'before, after')
            .join(' | ');
        const requirement = `ต้องแนบรูปก่อนทำงาน (before) และหลังทำงาน (after) ของ${needsZoneInFieldName ? 'ทุกบริการที่จอง' : 'งานนี้'} อย่างละ ${MIN_PHOTOS_PER_TYPE}-${MAX_PHOTOS_PER_TYPE} รูป — ฟิลด์ที่ต้องใช้: ${fieldHelp}`;

        // จัดกลุ่มไฟล์ตามชื่อฟิลด์: before | after | before_<zone_id> | after_<zone_id>
        const grouped = {}; // key `${type}|${zoneId}` -> files
        for (const f of files) {
            const m = /^(before|after)(?:_([A-Za-z0-9]+))?$/.exec(f.fieldname);
            const zoneId = m ? (m[2] || null) : undefined;
            const validZone = m && (needsZoneInFieldName ? zoneId && zones.some((z) => z.zone_id === zoneId) : zoneId === null || zones.some((z) => z.zone_id === zoneId));
            if (!validZone) throw { http: 400, message: `ชื่อฟิลด์รูป "${f.fieldname}" ไม่ถูกต้อง — ${requirement}` };
            const effectiveZone = needsZoneInFieldName ? zoneId : zones[0].zone_id;
            const key = `${m[1]}|${effectiveZone}`;
            (grouped[key] = grouped[key] || []).push(f);
        }

        const photos = []; // [photoType, zoneName, path]
        const summary = {};
        for (const z of zones) {
            for (const type of ['before', 'after']) {
                const list = grouped[`${type}|${z.zone_id}`] || [];
                if (list.length < MIN_PHOTOS_PER_TYPE || list.length > MAX_PHOTOS_PER_TYPE) {
                    const label = needsZoneInFieldName ? `${type}_${z.zone_id} (${z.zone_name})` : type;
                    throw { http: 400, message: `รูป ${label} ต้องมี ${MIN_PHOTOS_PER_TYPE}-${MAX_PHOTOS_PER_TYPE} รูป (ตอนนี้ ${list.length} รูป) — ${requirement}` };
                }
                list.forEach((f) => photos.push([type, z.zone_name, `/uploads/${f.filename}`]));
                summary[`${type}${needsZoneInFieldName ? '_' + z.zone_id : ''}`] = list.length;
            }
        }

        const [wallets] = await conn.query('SELECT wallet_id FROM maid_wallets WHERE maid_id = ? FOR UPDATE', [maidId]);
        if (wallets.length === 0) throw { http: 400, message: 'ไม่พบกระเป๋าเงิน (Wallet) ของแม่บ้านคนนี้' };
        const walletId = wallets[0].wallet_id;

        // 1. บันทึกรูปหลักฐาน (พร้อมชื่อโซนบริการ ให้ลูกค้าเลือกดูแยกโซนได้)
        const photoIds = await generateBulkIds('P', 'job_photos', 'photo_id', photos.length);
        await conn.query(
            'INSERT INTO job_photos (photo_id, booking_id, service_zone, photo_type, photo_path) VALUES ?',
            [photos.map(([type, zoneName, filePath], i) => [photoIds[i], bookingId, zoneName, type, filePath])]
        );

        // 2. ปิดงาน (ถ้ายังไม่เคยมีเวลาเริ่มงาน ให้ตั้งเป็นเวลาปิดงานเลย)
        await conn.query(
            "UPDATE bookings SET status = 'completed', completed_at = NOW(), job_started_at = COALESCE(job_started_at, NOW()) WHERE booking_id = ?",
            [bookingId]
        );

        // 3. โอนค่าบริการเต็มจำนวนเข้า Wallet แม่บ้าน + บันทึกประวัติ (ไม่มี trigger ในฐานข้อมูลแล้ว ต้องทำในโค้ดนี้)
        await conn.query('UPDATE maid_wallets SET wallet_balance = wallet_balance + ? WHERE wallet_id = ?', [amount, walletId]);
        const transactionId = await generateId('T', 'wallet_transactions', 'transaction_id'); // รหัสรายการแบบ T0001, T0002, ...
        await conn.query(
            "INSERT INTO wallet_transactions (transaction_id, wallet_id, amount, type, reference_id, note) VALUES (?, ?, ?, 'earning', ?, ?)",
            [transactionId, walletId, amount, bookingId, `ค่าบริการงาน #${bookingId}`]
        );

        // 4. นับจำนวนงานที่เสร็จของแม่บ้าน (ถ้ายังไม่มีแถวสถิติ ให้สร้าง)
        await conn.query(
            'INSERT INTO maid_stats (maid_id, completed_jobs) VALUES (?, 1) ON DUPLICATE KEY UPDATE completed_jobs = completed_jobs + 1',
            [maidId]
        );

        await conn.commit();

        // แจ้งลูกค้าทางอีเมลว่างานเสร็จแล้ว (ส่งหลัง commit สำเร็จเท่านั้น และไม่รอผลการส่ง ถ้าอีเมลล้มก็ไม่กระทบการปิดงาน)
        notifyBookingUpdate(bookingId, 'job_completed');

        const [[wallet]] = await conn.query('SELECT wallet_balance FROM maid_wallets WHERE wallet_id = ?', [walletId]);
        return res.json({
            success: true,
            booking_id: bookingId,
            status: 'completed',
            credited_amount: amount,
            wallet_balance: Number(wallet.wallet_balance),
            photos: summary,
        });
    } catch (err) {
        if (conn) { try { await conn.rollback(); } catch (_) { /* ignore */ } }
        removeUploadedFiles();
        if (err && err.http) return res.status(err.http).json({ success: false, error: err.message });
        console.error('Complete job error:', err);
        return res.status(500).json({ success: false, error: (err && err.message) || 'เกิดข้อผิดพลาดในการปิดงาน' });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
