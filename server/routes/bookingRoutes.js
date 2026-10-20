const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/upload');
const { notifyBookingUpdate } = require('../utils/notify');
const { generateId, generateBulkIds } = require('../utils/idGenerator');

// ข้อความสถานที่ เช่น "หอพักนนทรี ชั้น 2 ห้อง N203" ประกอบจากห้อง → อาคารตอนดึงข้อมูล (ไม่เก็บซ้ำในตาราง bookings)
// ใช้ต่อท้าย SELECT ของ "FROM bookings b" แล้วต่อ BOOKING_LOCATION_JOIN ท้ายคำสั่ง FROM
const BOOKING_LOCATION_SQL = `CONCAT(dbl.building_name, ' ชั้น ', drm.floor, ' ห้อง ', drm.room_number) AS location`;
const BOOKING_LOCATION_JOIN = `JOIN dorm_rooms drm ON drm.room_id = b.room_id JOIN dorm_buildings dbl ON dbl.building_id = drm.building_id`;

// ดึงข้อมูลบริการทั้งหมดจากตาราง service_zones (ราคาจากฐานข้อมูล)
router.get('/service-zones', (req, res) => {
    const sql = `SELECT zone_id, zone_name, student_price, staff_price, is_addon FROM service_zones ORDER BY is_addon ASC, zone_id ASC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ดึงรายชื่ออาคาร/หอพักที่เปิดให้จอง พร้อมห้องที่เปิดให้จองของแต่ละอาคาร (ใช้ในหน้าเลือกหอพัก)
// รูปแบบข้อมูล: { id, label, dormType, code, lat, lng, rooms: [{ id (room_id), floor, room, label }] }
router.get('/dorm-buildings', (req, res) => {
    db.query('SELECT building_id, building_name, dorm_type, lat, lng FROM dorm_buildings WHERE is_active = 1 ORDER BY dorm_type DESC, building_id', (err, buildings) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('SELECT room_id, building_id, floor, room_number FROM dorm_rooms WHERE is_active = 1 ORDER BY building_id, floor, room_number', (err2, rooms) => {
            if (err2) return res.status(500).json({ error: err2.message });
            const roomsByBuilding = {};
            for (const r of rooms) {
                (roomsByBuilding[r.building_id] = roomsByBuilding[r.building_id] || []).push({
                    id: r.room_id,
                    floor: r.floor,
                    room: r.room_number,
                    label: `ชั้น ${r.floor} ห้อง ${r.room_number}`,
                });
            }
            res.json(buildings.map((b) => ({
                id: b.building_id,
                code: b.building_id,
                label: b.building_name,
                dormType: b.dorm_type,
                lat: b.lat != null ? Number(b.lat) : null,
                lng: b.lng != null ? Number(b.lng) : null,
                rooms: roomsByBuilding[b.building_id] || [],
            })));
        });
    });
});

// 1. ลูกค้าสร้างรายการจอง (คำนวณราคาจากฐานข้อมูล service_zones)
router.post('/bookings', async (req, res) => {
    // ข้อมูลที่หน้าเว็บส่งมา: ผู้จอง, ห้องที่จอง (room_id), โซนที่เลือก, วันเวลา, เบอร์โทร, พิกัด, หมายเหตุ
    // ประเภทหอ (student/staff) ไม่รับจากหน้าเว็บ แต่หาจากห้องที่เลือกในฐานข้อมูลเอง (ห้อง → อาคาร)
    // ข้อความสถานที่ไม่เก็บในตาราง bookings ตอนดึงรายการจองจะประกอบจากห้อง/อาคารด้วย JOIN (ดู BOOKING_LOCATION_SQL)
    const { user_id, room_id, zones, date, customer_phone, lat, lng, customer_note } = req.body;

    // --- ขั้นที่ 0: หาห้องและอาคาร ต้องเป็นห้องที่มีอยู่จริงและเปิดให้จอง ---
    let dorm_type;
    try {
        const roomRows = await new Promise((resolve, reject) => {
            db.query(
                `SELECT b.dorm_type
                 FROM dorm_rooms r JOIN dorm_buildings b ON b.building_id = r.building_id
                 WHERE r.room_id = ? AND r.is_active = 1 AND b.is_active = 1`,
                [room_id],
                (err, results) => (err ? reject(err) : resolve(results))
            );
        });
        if (roomRows.length === 0) return res.status(400).json({ error: 'ไม่พบห้องที่เลือก หรือห้องนี้ปิดให้จอง' });
        dorm_type = roomRows[0].dorm_type;
    } catch (roomErr) {
        return res.status(500).json({ error: 'Failed to look up room: ' + roomErr.message });
    }

    // --- ขั้นที่ 1: คำนวณราคาจากฐานข้อมูล (ไม่เชื่อราคาที่หน้าเว็บส่งมา กันการแก้ราคาเอง) ---
    // หอนักศึกษาใช้ราคา student_price, หอบุคลากรใช้ staff_price
    const priceColumn = dorm_type === 'staff' ? 'staff_price' : 'student_price';
    let total_price = 0;
    let priceByZone = {}; // zone_id -> price ณ ตอนจอง ใช้บันทึกลง booking_services.price_at_booking ด้วย
    try {
        if (Array.isArray(zones) && zones.length > 0) {
            const [priceRows] = await new Promise((resolve, reject) => {
                const placeholders = zones.map(() => '?').join(',');
                const sql = `SELECT zone_id, ${priceColumn} AS price FROM service_zones WHERE zone_id IN (${placeholders})`;
                db.query(sql, zones, (err, results) => {
                    if (err) return reject(err);
                    resolve([results]);
                });
            });
            priceRows.forEach(row => {
                total_price += Number(row.price);
                priceByZone[row.zone_id] = Number(row.price);
            });
        }
    } catch (priceErr) {
        console.error('[WARN] Could not fetch prices from service_zones, using 0:', priceErr.message);
    }
    
    try {
        // สร้างรหัสการจองใหม่ เช่น B0005
        const newBookingId = await generateId('B', 'bookings', 'booking_id');

        // 1. แทรกข้อมูลการจองหลัก (เฉพาะข้อมูลสถานที่และเวลา)
        const bookingSql = `
            INSERT INTO bookings (
                booking_id, user_id, room_id, booking_date,
                customer_phone, lat, lng, customer_note,
                status, maid_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting_maid', 'pending')
        `;

        db.query(bookingSql, [newBookingId, user_id, room_id, date, customer_phone, lat, lng, customer_note], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to create booking: ' + err.message });
            }

            // 2. แทรกรายการบริการที่เลือก (ลงตารางแยก booking_services)
            if (Array.isArray(zones) && zones.length > 0) {
                // แต่ละโซนเป็น 1 แถว: [รหัสรายการ (S0001...), รหัสการจอง, รหัสโซน, ราคา ณ ตอนจอง, เป็นบริการเสริมไหม]
                // บริการเสริม (add-on) คือ fridge, laundry, ironing
                const serviceSql = `INSERT INTO booking_services (service_id, booking_id, service_zone_id, price_at_booking, is_addon) VALUES ?`;
                generateBulkIds('S', 'booking_services', 'service_id', zones.length).then((serviceIds) => {
                    const serviceValues = zones.map((z, i) => {
                        const isAddon = ['fridge', 'laundry', 'ironing'].includes(z) ? 1 : 0;
                        return [serviceIds[i], newBookingId, z, priceByZone[z] || 0, isAddon];
                    });
                    db.query(serviceSql, [serviceValues], (errServices) => {
                        if (errServices) {
                            console.error('[ERROR] Failed to insert services:', errServices);
                        }
                    });
                }).catch((errIds) => {
                    console.error('[ERROR] Failed to generate service ids:', errIds);
                });
            }

            // 3. แทรกข้อมูลการชำระเงิน (ลงตารางแยก booking_payments)
            const paymentSql = `
                INSERT INTO booking_payments (
                    payment_id, booking_id, total_price, payment_status, payment_deadline
                ) VALUES (?, ?, ?, 'unpaid', DATE_ADD(NOW(), INTERVAL 30 MINUTE))
            `;
            // กำหนดเวลาชำระเงิน = 30 นาทีจากตอนนี้ (ถ้าเลยเวลา cron จะยกเลิกอัตโนมัติ)
            generateId('P', 'booking_payments', 'payment_id').then((newPaymentId) => {
                db.query(paymentSql, [newPaymentId, newBookingId, total_price], (errPayment) => {
                    if (errPayment) {
                        return res.status(500).json({ error: errPayment.message });
                    }
                    
                    // ส่งอีเมลแจ้งแอดมินว่ามีการจองใหม่ แล้วตอบกลับรหัสการจองและยอดรวม
                    notifyBookingUpdate(newBookingId, 'created');
                    return res.json({ success: true, bookingId: newBookingId, total_price });
                });
            }).catch((genPaymentErr) => {
                return res.status(500).json({ error: "Failed to generate payment ID" });
            });
        });
    } catch (genErr) {
        console.error('[CRITICAL] genErr:', genErr);
        res.status(500).json({ error: "Failed to generate IDs for booking" });
    }
});

// ============================================================================
// 2. ดึงข้อมูลการจอง
// ============================================================================
// GET /api/admin/bookings — แอดมินดูการจองทั้งหมด
// รวมข้อมูลจากหลายตาราง: ลูกค้า (users), แม่บ้าน (maids), การชำระเงิน (booking_payments),
// การคืนเงิน (booking_refunds) และจำนวนรูปผลงาน (job_photos)
router.get('/admin/bookings', (req, res) => {
    const sql = `
        SELECT b.*, ${BOOKING_LOCATION_SQL},
               u.fullname as user_name, u.email as user_email,
               m.title_prefix, m.first_name, m.last_name, m.phone as maid_phone, m.profile_pic as maid_profile_pic,
               p.total_price, p.payment_status, p.payment_slip,
               r.refund_id, r.reason_type, r.reason_text, r.status as refund_status, r.refund_amount, r.compensation_amount,
               r.refund_bank_name, r.refund_account_number, r.refund_account_name, r.customer_refund_status,
               r.admin_note as refund_admin_note, r.reported_at as refund_requested_at, r.evidence_images,
               (SELECT COUNT(*) FROM job_photos jp WHERE jp.booking_id = b.booking_id) as job_photos_count
        FROM bookings b
        ${BOOKING_LOCATION_JOIN}
        LEFT JOIN users u ON b.user_id = u.user_id
        LEFT JOIN maids m ON b.maid_id = m.maid_id
        LEFT JOIN booking_payments p ON b.booking_id = p.booking_id
        LEFT JOIN booking_refunds r ON b.booking_id = r.booking_id
        ORDER BY b.created_at DESC
    `;
    db.query(sql, (err, bookings) => {
        if (err) return res.status(500).json({ error: err.message });
        if (bookings.length === 0) return res.json([]);

        // ดึงโซนบริการของทุกการจองในครั้งเดียว แล้วจับคู่เข้ากับแต่ละการจองเป็น b.zones
        const bookingIds = bookings.map(b => b.booking_id);
        const serviceSql = `SELECT * FROM booking_services WHERE booking_id IN (?)`;

        db.query(serviceSql, [bookingIds], (err2, services) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            const servicesByBooking = {};
            services.forEach(s => {
                if (!servicesByBooking[s.booking_id]) servicesByBooking[s.booking_id] = [];
                servicesByBooking[s.booking_id].push(s.service_zone_id);
            });

            bookings.forEach(b => {
                b.zones = servicesByBooking[b.booking_id] || [];
                // ม้วนข้อมูลแม่บ้านไว้เป็นก้อนเดียวเพื่อให้เข้ากับ Frontend เดิม (ถ้ามี)
                if (b.maid_id) {
                    b.assigned_maids = [{
                        maid_id: b.maid_id,
                        title_prefix: b.title_prefix,
                        first_name: b.first_name,
                        last_name: b.last_name,
                        phone: b.maid_phone,
                        profile_pic: b.maid_profile_pic,
                        maid_status: b.maid_status || 'accepted'
                    }];
                } else {
                    b.assigned_maids = [];
                }
            });
            res.json(bookings);
        });
    });
});

// GET /api/my-bookings/:userId — ประวัติการจองของลูกค้าคนหนึ่ง
// รวมข้อมูลแม่บ้าน + คะแนนเฉลี่ย, การชำระเงิน, การคืนเงิน และคะแนนรีวิวที่ลูกค้าให้ไว้
router.get('/my-bookings/:userId', (req, res) => {
    console.log(`[API CALL] GET /my-bookings/${req.params.userId}`);
    const sql = `
        SELECT b.*, ${BOOKING_LOCATION_SQL},
               m.title_prefix, m.first_name, m.last_name, m.phone as maid_phone, m.profile_pic as maid_profile_pic,

               ms.average_rating as maid_average_rating,
               p.total_price, p.payment_status, p.payment_slip, p.payment_deadline, r.status as refund_status, r.reason_type, r.refund_bank_name, r.refund_amount, r.customer_refund_status, r.evidence_images,
               r.admin_note as refund_admin_note, r.resolved_at as refund_resolved_at,
               (SELECT rating FROM booking_reviews br WHERE br.booking_id = b.booking_id LIMIT 1) as my_rating
        FROM bookings b
        ${BOOKING_LOCATION_JOIN}
        LEFT JOIN maids m ON b.maid_id = m.maid_id
        LEFT JOIN maid_stats ms ON m.maid_id = ms.maid_id
        LEFT JOIN booking_payments p ON b.booking_id = p.booking_id
        LEFT JOIN booking_refunds r ON b.booking_id = r.booking_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `;
    db.query(sql, [req.params.userId], (err, bookings) => {
        if (err) return res.status(500).json({ error: err.message });
        if (bookings.length === 0) return res.json([]);

        // ดึงโซนบริการของแต่ละการจองมารวม (เหมือนฝั่งแอดมิน)
        const bookingIds = bookings.map(b => b.booking_id);
        const serviceSql = `SELECT * FROM booking_services WHERE booking_id IN (?)`;

        db.query(serviceSql, [bookingIds], (err2, services) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            const servicesByBooking = {};
            services.forEach(s => {
                if (!servicesByBooking[s.booking_id]) servicesByBooking[s.booking_id] = [];
                servicesByBooking[s.booking_id].push(s.service_zone_id);
            });

            bookings.forEach(b => {
                b.zones = servicesByBooking[b.booking_id] || [];
                // จัดข้อมูลแม่บ้านเป็น array assigned_maids ตามรูปแบบที่หน้าเว็บใช้
                if (b.maid_id) {
                    b.assigned_maids = [{
                        maid_id: b.maid_id,
                        title_prefix: b.title_prefix,
                        first_name: b.first_name,
                        last_name: b.last_name,
                        phone: b.maid_phone,
                        profile_pic: b.maid_profile_pic,
                        average_rating: b.maid_average_rating,
                        maid_status: b.maid_status
                    }];
                } else {
                    b.assigned_maids = [];
                }
            });
            res.json(bookings);
        });
    });
});

// ============================================================================
// 3. จัดการสถานะงาน (อัปเดต / ลบ)
// ============================================================================
// PUT /api/bookings/:id/status — เปลี่ยนสถานะการจองและบันทึกหมายเหตุ (ถ้าเป็นการยกเลิกจะส่งอีเมลแจ้งลูกค้า)
router.put('/bookings/:id/status', (req, res) => {
    const { status, note } = req.body || {};
    const bookingId = req.params.id;

    // ถ้าเปลี่ยนเป็นสถานะยกเลิก เก็บหมายเหตุไว้ใน cancel_reason (เหตุผลที่ยกเลิก)
    // ส่วนสถานะอื่นเก็บใน admin_note (หมายเหตุแอดมิน เช่น เหตุผลปฏิเสธสลิป) แยกกันไม่ปนกัน
    const noteColumn = String(status || '').startsWith('cancel') ? 'cancel_reason' : 'admin_note';
    db.query(`UPDATE bookings SET status = ?, ${noteColumn} = ? WHERE booking_id = ?`, [status, note, bookingId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        if (status === 'cancelled') notifyBookingUpdate(bookingId, 'cancelled', { note });

        res.json({ success: true });
    });
});

// ============================================================================
// 4. ระบบการชำระเงิน และ คืนเงิน
// ============================================================================

module.exports = router;



