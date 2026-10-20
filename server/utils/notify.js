const db = require('../config/db');
const { sendEmail, ADMIN_EMAIL } = require('./email');

// เบอร์ติดต่อผู้ดูแลระบบที่แสดงท้ายอีเมลลูกค้า (เบอร์สมมุติ — ตั้งเบอร์จริงได้ที่ ADMIN_PHONE ใน server/.env)
const ADMIN_CONTACT_PHONE = process.env.ADMIN_PHONE || '02-123-4567';

// ป้องกันราคาว่าง/undefined ในอีเมล เมื่อยังไม่มีข้อมูลราคาในฐานข้อมูล ณ เวลาที่ส่ง
const formatPrice = (value) => Number(value || 0).toFixed(2);

// หมายเหตุจากแอดมินถูกพิมพ์เอง จึงต้อง escape ก่อนใส่ลงใน HTML ของอีเมล
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * ฟังก์ชันแจ้งเตือนลูกค้าและแอดมินผ่านอีเมล
 */
const notifyBookingUpdate = (bookingId, actionType, extraData = {}) => {
    // ดึงข้อมูลการจอง ชื่อ/อีเมลลูกค้า และยอดเงิน เพื่อใส่ในเนื้อหาอีเมล
    const sql = `SELECT b.*, u.email, u.fullname, p.total_price, p.payment_deadline FROM bookings b LEFT JOIN users u ON b.user_id = u.user_id LEFT JOIN booking_payments p ON b.booking_id = p.booking_id WHERE b.booking_id = ?`;
    db.query(sql, [bookingId], (err, results) => {
        if (err || results.length === 0) return;
        const data = results[0];

        // หัวข้อและเนื้อหาอีเมล แยกของลูกค้า (user) กับของแอดมิน (admin)
        let userTitle = '', userDetail = '';
        let adminTitle = '', adminDetail = '';
        let skipUserEmail = false;

        // เลือกข้อความตามเหตุการณ์ที่เกิดขึ้น (actionType ที่ route ส่งมา)
        switch (actionType) {
            // ลูกค้าสร้างการจองใหม่ (POST /api/bookings)
            case 'created':
                userTitle = 'ได้รับคำขอจองบริการแล้ว'; userDetail = 'ระบบได้รับข้อมูลการจองของคุณแล้ว ขณะนี้กำลังเปิดให้พนักงานเลือกรับงานของคุณ โปรดรอสักครู่เมื่อมีพนักงานรับงานระบบจะแจ้งให้คุณชำระเงินค่ะ';
                adminTitle = 'มีรายการจองบริการใหม่ในบอร์ดงาน'; adminDetail = `ลูกค้า <b>คุณ ${data.fullname}</b> ได้ส่งคำขอจองบริการใหม่เข้ามา (รหัสการจอง #${bookingId})<br>ขณะนี้งานถูกส่งเข้าบอร์ดกลางเพื่อให้พนักงานเลือกรับแล้วค่ะ`;
                break;
            // มีแม่บ้านรับงาน → แจ้งลูกค้าให้ชำระเงินภายใน 30 นาที
            // (ส่งจาก PUT /api/maid/jobs/:bookingId/accept)
            case 'accepted':
                userTitle = 'พนักงานรับงานของคุณแล้ว!'; userDetail = `พนักงานได้กดรับงานของคุณเรียบร้อยแล้ว ยอดชำระคือ <b style="color:#006664; font-size:18px;">${formatPrice(data.total_price)} บาท</b><br><br><b>⚠️ โปรดชำระเงินภายใน 30 นาที</b><br><br>กรุณาเข้าสู่ระบบเพื่อชำระเงินเพื่อยืนยันคิวงาน หากเกินเวลาที่กำหนดระบบจะยกเลิกคิวงานอัตโนมัติเพื่อให้พนักงานรับงานอื่นได้ค่ะ`;
                adminTitle = 'พนักงานรับงานสำเร็จ'; adminDetail = `พนักงานได้กดรับรายการจอง #${bookingId} (ลูกค้า: ${data.fullname}) เรียบร้อยแล้ว ขณะนี้ระบบกำลังรอให้ลูกค้าชำระเงินภายใน 30 นาทีค่ะ`;
                break;
            // การจองถูกยกเลิก (cron หมดเวลาชำระ/ไม่มีแม่บ้านรับ หรือเปลี่ยนสถานะเป็นยกเลิก) — extraData.note = เหตุผล
            case 'cancelled':
                userTitle = 'ยกเลิกบริการ'; userDetail = `รายการจองของคุณถูกยกเลิกแล้ว<br><br><b>เหตุผล/หมายเหตุ:</b> ${extraData.note}`;
                adminTitle = 'รายการจองถูกยกเลิก'; adminDetail = `รายการจองหมายเลข #${bookingId} ของคุณ <b>${data.fullname}</b> ถูกยกเลิกแล้ว<br><br><b>เหตุผล/หมายเหตุ:</b> ${extraData.note}`;
                break;
            // ลูกค้าอัปโหลดสลิปแล้ว (POST /api/bookings/:id/pay) → แจ้งแอดมินให้ตรวจสลิป
            case 'paid':
                userTitle = 'แจ้งโอนเงินสำเร็จ'; userDetail = 'ระบบได้รับหลักฐานการโอนเงินของคุณแล้ว ขณะนี้ผู้ดูแลระบบกำลังตรวจสอบความถูกต้อง โปรดรอการยืนยันสักครู่ค่ะ';
                adminTitle = 'ลูกค้าแจ้งชำระเงิน (รอตรวจสอบสลิป)'; adminDetail = `ลูกค้า <b>คุณ ${data.fullname}</b> ได้แนบหลักฐานการโอนเงินสำหรับรายการจอง #${bookingId} แล้ว<br><br>กรุณาเข้าสู่ระบบเพื่อตรวจสอบความถูกต้องของสลิปและอนุมัติยอดเงินค่ะ`;
                break;
            // แอดมินอนุมัติสลิป (PUT /api/bookings/:id/confirm-payment)
            case 'approved':
                userTitle = 'ยืนยันการชำระเงินสำเร็จ'; userDetail = 'ผู้ดูแลระบบตรวจสอบยอดเงินเรียบร้อยแล้ว! คิวงานของคุณได้รับการยืนยัน พนักงานจะเข้าให้บริการตามวันและเวลาที่นัดหมายค่ะ';
                adminTitle = 'อนุมัติสลิปสำเร็จ'; adminDetail = `คุณได้อนุมัติยอดเงินสำหรับรายการจอง #${bookingId} เรียบร้อยแล้ว<br>สถานะงานถูกเปลี่ยนเป็น <b>"ยืนยันคิวงาน (Confirmed)"</b>`;
                break;
            // แอดมินปฏิเสธสลิป (PUT /api/bookings/:id/reject-payment) หรือไม่อนุมัติคืนเงินใน refund-complete
            case 'rejected':
                userTitle = 'สลิปโอนเงินไม่ถูกต้อง'; userDetail = `<span style="color: red; font-weight: bold;">ผู้ดูแลระบบปฏิเสธหลักฐานการโอนเงินของคุณ</span><br><br><b>เหตุผล:</b> ${extraData.note}<br><br>กรุณาเข้าสู่ระบบเพื่ออัปโหลดสลิปที่ถูกต้องใหม่อีกครั้งค่ะ`;
                adminTitle = 'ปฏิเสธสลิปสำเร็จ'; adminDetail = `คุณได้ปฏิเสธสลิปของรายการจอง #${bookingId} เรียบร้อยแล้ว<br><br><b>เหตุผลที่แจ้งลูกค้า:</b> ${extraData.note}<br><br>ระบบได้ส่งอีเมลแจ้งให้ลูกค้าอัปโหลดสลิปใหม่แล้ว`;
                break;
            // แอดมินบันทึกว่าคืนเงินแล้ว (PUT /api/bookings/:id/refund-complete)
            case 'refund_completed': {
                // ใช้ยอดที่แอดมินอนุมัติจริง (amountToUser) ถ้ามี ไม่งั้น fallback เป็นราคาเต็มของงาน (flow เก่าที่คืนเต็มจำนวนเสมอ)
                const refundedAmount = extraData.amountToUser != null ? extraData.amountToUser : data.total_price;
                userTitle = 'โอนเงินคืนเรียบร้อยแล้ว'; userDetail = `<span style="color: #006664; font-weight: bold;">ผู้ดูแลระบบได้ทำการโอนเงินคืนให้คุณเรียบร้อยแล้ว</span><br><br><b>ยอดเงิน:</b> ${formatPrice(refundedAmount)} บาท<br>โปรดตรวจสอบยอดเงินในบัญชีธนาคารของคุณค่ะ`;
                adminTitle = 'บันทึกการคืนเงินสำเร็จ'; adminDetail = `คุณได้บันทึกสถานะการคืนเงินสำหรับรายการจอง #${bookingId} เรียบร้อยแล้ว ระบบได้ส่งอีเมลแจ้งลูกค้าแล้วค่ะ`;
                break;
            }
            // มีการแจ้งปัญหา/ขอคืนเงิน (POST /api/bookings/:id/refund-report) — แยกกรณีแม่บ้านแจ้ง กับลูกค้าแจ้ง
            case 'dispute_created': {
                const maidReportTypes = ['maid_no_contact', 'maid_location_not_found', 'maid_unsafe_site', 'maid_sudden_cancel', 'maid_other'];
                const isMaidReport = maidReportTypes.includes(extraData.reason);
                if (isMaidReport) {
                    userTitle = 'มีการแจ้งปัญหาหน้างานจากผู้ให้บริการ';
                    userDetail = `ผู้ให้บริการได้แจ้งปัญหาเกี่ยวกับรายการจอง #${bookingId} เข้ามาในระบบ<br><br>ผู้ดูแลระบบกำลังตรวจสอบเรื่องนี้ และจะแจ้งผลการพิจารณาให้คุณทราบเร็วๆ นี้ค่ะ`;
                    adminTitle = 'แม่บ้านแจ้งปัญหาหน้างาน (รอพิจารณา)';
                    adminDetail = `พนักงานผู้ให้บริการได้รายงานปัญหาสำหรับรายการจอง #${bookingId} (ลูกค้า: ${data.fullname})<br><br>กรุณาเข้าสู่ระบบเพื่อพิจารณาคำขอคืนเงิน/ชดเชยค่ะ`;
                } else {
                    userTitle = 'ส่งคำร้องเรียนสำเร็จ';
                    userDetail = `ระบบได้รับคำร้องของคุณสำหรับรายการจอง #${bookingId} แล้ว<br><br>ผู้ดูแลระบบกำลังตรวจสอบและจะแจ้งผลการพิจารณาให้คุณทราบเร็วๆ นี้ค่ะ`;
                    adminTitle = 'ลูกค้าแจ้งปัญหา/ขอคืนเงิน (รอพิจารณา)';
                    adminDetail = `ลูกค้า <b>คุณ ${data.fullname}</b> ได้แจ้งปัญหาสำหรับรายการจอง #${bookingId}<br><br>กรุณาเข้าสู่ระบบเพื่อพิจารณาคำขอค่ะ`;
                    skipUserEmail = true; // ลูกค้าเพิ่งกดแจ้งปัญหาเอง เห็นผลในแอปทันทีแล้ว ไม่ต้องส่งอีเมลซ้ำ
                }
                break;
            }
            // อนุมัติเงินคืนแล้ว แต่ลูกค้ายังไม่ได้กรอกบัญชีธนาคาร → ขอให้กรอกบัญชี
            case 'refund_awaiting_bank_info': {
                const pendingAmount = extraData.amountToUser != null ? extraData.amountToUser : data.total_price;
                userTitle = 'กรุณากรอกบัญชีธนาคารเพื่อรับเงินคืน';
                userDetail = `ผู้ดูแลระบบได้พิจารณาเรื่องที่ผู้ให้บริการแจ้งเข้ามาสำหรับรายการจอง #${bookingId} แล้ว และอนุมัติเงินคืนให้คุณ <b style="color:#006664; font-size:18px;">${formatPrice(pendingAmount)} บาท</b><br><br><b>⚠️ ระบบยังไม่มีบัญชีธนาคารของคุณสำหรับโอนเงินคืน</b><br><br>กรุณาเข้าสู่ระบบและกรอกบัญชีธนาคารที่หน้าประวัติการจอง เพื่อให้ผู้ดูแลระบบดำเนินการโอนเงินคืนให้คุณค่ะ`;
                adminTitle = 'ส่งอีเมลแจ้งลูกค้ากรอกบัญชีแล้ว';
                adminDetail = `คุณได้อนุมัติเงินคืนสำหรับรายการจอง #${bookingId} (ลูกค้า: ${data.fullname}) เรียบร้อยแล้ว<br><br>ระบบได้ส่งอีเมลแจ้งให้ลูกค้ากรอกบัญชีธนาคารแล้ว เมื่อลูกค้ากรอกครบ รายการจะขึ้นสถานะ "รอโอนเงินคืน" ให้คุณกดยืนยันโอนที่การ์ดรายการจองนี้ค่ะ`;
                break;
            }
            case 'refund_approved_pending_transfer': {
                // อนุมัติแล้วและมีบัญชีลูกค้าอยู่แล้ว แต่ยังไม่ได้โอน (ต่างจาก refund_completed ที่โอนเสร็จแล้ว)
                const approvedAmount = extraData.amountToUser != null ? extraData.amountToUser : data.refund_amount;
                userTitle = 'อนุมัติเงินคืนแล้ว รอโอนเงิน';
                userDetail = `ผู้ดูแลระบบได้พิจารณาเรื่องของรายการจอง #${bookingId} แล้ว และอนุมัติเงินคืนให้คุณ <b style="color:#006664; font-size:18px;">${formatPrice(approvedAmount)} บาท</b><br><br>ผู้ดูแลระบบจะโอนเงินเข้าบัญชีที่คุณแจ้งไว้เร็วๆ นี้ และจะแจ้งให้ทราบอีกครั้งเมื่อโอนเรียบร้อยค่ะ`;
                break;
            }
            // พิจารณาเสร็จ แต่ไม่มีเงินคืน
            case 'dispute_resolved_no_refund': {
                userTitle = 'ผลการพิจารณาคำขอของคุณ';
                userDetail = `ผู้ดูแลระบบได้พิจารณาเรื่องของรายการจอง #${bookingId} เสร็จสิ้นแล้ว <b>โดยไม่มียอดเงินคืน</b>${extraData.note ? `<br><br><b>หมายเหตุจากผู้ดูแลระบบ:</b> ${escapeHtml(extraData.note)}` : ''}`;
                break;
            }
            // ไม่อนุมัติคำขอคืนเงิน
            case 'dispute_rejected': {
                // ข้อความเดียวกับกล่องแจ้งผลในหน้าประวัติการจอง (BookingPriceStatus) เพื่อให้อีเมลกับหน้าเว็บสอดคล้องกัน
                userTitle = 'ผลการพิจารณาคำขอของคุณ';
                const rejectHeadline = extraData.isMaidReport
                    ? 'ตรวจสอบเรื่องที่ผู้ให้บริการแจ้งแล้ว'
                    : 'ไม่อนุมัติคำขอคืนเงิน';
                const rejectReason = extraData.note
                    ? `เหตุผลจากแอดมิน: ${escapeHtml(extraData.note)}`
                    : extraData.isMaidReport
                        ? 'แอดมินตรวจสอบแล้ว ไม่มีการคืนเงิน และงานนี้ดำเนินการตามเดิม'
                        : 'แอดมินตรวจสอบแล้วพบว่าเหตุผลที่แจ้งไม่สอดคล้องกับข้อเท็จจริง จึงไม่สามารถคืนเงินได้';
                userDetail = `<b>${rejectHeadline}</b><br><br>รายการจอง #${bookingId}<br>${rejectReason}`;
                break;
            }
            // ลูกค้ากรอกบัญชีธนาคารแล้ว (PUT /api/bookings/:id/refund-bank-info) → แจ้งแอดมินให้โอน
            case 'refund_bank_info_submitted': {
                const readyAmount = extraData.amountToUser != null ? extraData.amountToUser : data.refund_amount;
                userTitle = 'ส่งข้อมูลบัญชีธนาคารสำเร็จ';
                userDetail = `ระบบได้รับข้อมูลบัญชีธนาคารของคุณสำหรับรายการจอง #${bookingId} แล้ว<br><br><b>บัญชีที่แจ้งไว้:</b> ${extraData.bankName || '-'} เลขที่ ${extraData.accountNumber || '-'}<br><b>ยอดเงินที่รอโอน:</b> ${formatPrice(readyAmount)} บาท<br><br>ผู้ดูแลระบบจะดำเนินการโอนเงินคืนให้คุณเร็วๆ นี้ค่ะ`;
                adminTitle = 'ลูกค้ากรอกบัญชีธนาคารแล้ว (พร้อมโอนเงินคืน)';
                adminDetail = `ลูกค้า <b>คุณ ${data.fullname}</b> ได้กรอกบัญชีธนาคารสำหรับรับเงินคืนของรายการจอง #${bookingId} เรียบร้อยแล้ว<br><br><b>บัญชี:</b> ${extraData.bankName || '-'} เลขที่ ${extraData.accountNumber || '-'} ชื่อบัญชี ${extraData.accountName || '-'}<br><b>ยอดที่ต้องโอน:</b> ${formatPrice(readyAmount)} บาท<br><br>กรุณาเข้าสู่ระบบเพื่อโอนเงินและกดยืนยันที่การ์ดรายการจองนี้ค่ะ`;
                break;
            }
            // แอดมินกดยืนยันว่าโอนเงินคืนแล้ว (PUT /api/admin/refunds/:refundId/mark-paid)
            case 'refund_paid': {
                const paidAmount = extraData.amountToUser != null ? extraData.amountToUser : data.total_price;
                userTitle = 'โอนเงินคืนเรียบร้อยแล้ว';
                userDetail = `<span style="color: #006664; font-weight: bold;">ผู้ดูแลระบบได้โอนเงินคืนให้คุณเรียบร้อยแล้ว</span><br><br><b>ยอดเงิน:</b> ${formatPrice(paidAmount)} บาท<br>โปรดตรวจสอบยอดเงินในบัญชีธนาคารของคุณค่ะ`;
                break;
            }
            // แม่บ้านเริ่มให้บริการแล้ว (PUT /api/maid/jobs/:bookingId/start)
            case 'job_started': {
                userTitle = 'แม่บ้านเริ่มให้บริการแล้ว';
                userDetail = `<span style="color: #006664; font-weight: bold;">แม่บ้านเริ่มให้บริการตามรายการจอง #${bookingId} แล้ว</span><br><br>ขณะนี้งานอยู่ระหว่างการให้บริการ เมื่อแม่บ้านปิดงาน ระบบจะแจ้งให้คุณทราบอีกครั้ง และคุณสามารถดูรูปภาพผลงานได้ที่หน้าประวัติการจองค่ะ`;
                break;
            }
            // แม่บ้านปิดงานแล้ว (PUT /api/maid/jobs/:bookingId/complete) — แจ้งลูกค้าให้ดูรูปผลงาน ให้คะแนน และรู้กรอบเวลาขอคืนเงิน
            case 'job_completed': {
                userTitle = 'งานบริการเสร็จสิ้นแล้ว';
                userDetail = `<span style="color: #006664; font-weight: bold;">แม่บ้านได้ดำเนินการตามรายการจอง #${bookingId} เสร็จเรียบร้อยแล้ว</span><br><br>คุณสามารถดูรูปภาพผลงาน (ก่อน/หลัง) และให้คะแนนความพึงพอใจได้ที่หน้าประวัติการจองค่ะ<br><br>หากพบปัญหาจากการให้บริการ สามารถแจ้งขอคืนเงินได้ภายใน <b>24 ชั่วโมง</b> หลังงานเสร็จ ผ่านหน้าประวัติการจองเช่นกันค่ะ<br><br>ขอบคุณที่ใช้บริการ KUCSC Clean`;
                break;
            }
            // actionType ที่ไม่รู้จัก → ไม่ส่งอีเมล
            default: return;
        }

        // แม่แบบอีเมล HTML (หัวสีเขียวของแบรนด์ + กล่องเนื้อหา) ใช้ทั้งอีเมลลูกค้าและแอดมิน
        const buildHtml = (title, detail, recipientName, isAdmin = false) => `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #006664; padding: 25px 20px; text-align: center; color: white;">
                    <h2 style="margin: 0; font-size: 20px;">${title}</h2>
                    <p style="margin: 5px 0 0 0; color: #B2BB1E; font-size: 14px;">รายการจองหมายเลข #${bookingId}</p>
                </div>
                <div style="padding: 25px 20px; color: #334155; line-height: 1.6; font-size: 15px;">
                    <p style="margin-top: 0;"><b>เรียน ${recipientName}</b></p>
                    <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #006664; margin-bottom: 20px;">
                        ${detail}
                    </div>
                    <p style="margin-bottom: 0; font-size: 14px;">โปรดเข้าสู่ระบบเพื่อตรวจสอบรายละเอียดเพิ่มเติม</p>
                    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 25px 0;">
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0;">นี่คืออีเมลอัตโนมัติจากระบบ KUCSC Clean${isAdmin ? '' : `<br>หากมีข้อสงสัย โปรดติดต่อผู้ดูแลระบบ โทร ${ADMIN_CONTACT_PHONE}`}</p>
                </div>
            </div>
        `;

        // เคสที่ลูกค้าเพิ่งกดทำเองสดๆ ในแอป เห็นผลลัพธ์อยู่ตรงหน้าแล้ว ไม่ต้องส่งอีเมลแจ้งซ้ำ
        const skipUserEmailTypes = ['created', 'paid', 'refund_bank_info_submitted'];
        if (data.email && !skipUserEmail && !skipUserEmailTypes.includes(actionType)) {
            sendEmail(data.email, `[KUCSC Clean] ${userTitle} (รหัส #${bookingId})`, buildHtml(userTitle, userDetail, `คุณ ${data.fullname || 'ผู้ใช้บริการ'}`));
        }
        // เคสที่แอดมินเป็นคนกดปฏิบัติการเองสดๆ อยู่แล้ว (approved/rejected/refund_completed/refund_awaiting_bank_info/refund_paid)
        // และเคสที่ไม่มีอะไรให้แอดมินทำต่อ (created/cancelled/accepted) ไม่ต้องส่งอีเมลแจ้งแอดมินซ้ำ
        const skipAdminEmail = [
            'cancelled', 'created', 'refund_paid',
            'approved', 'rejected', 'refund_completed', 'refund_awaiting_bank_info',
            'refund_approved_pending_transfer', 'dispute_resolved_no_refund', 'dispute_rejected',
            'accepted', 'job_started', 'job_completed',
        ];
        if (ADMIN_EMAIL && !skipAdminEmail.includes(actionType)) {
            sendEmail(ADMIN_EMAIL, `[Admin แจ้งเตือน] ${adminTitle} (รหัส #${bookingId})`, buildHtml(adminTitle, adminDetail, 'แอดมิน (ผู้ดูแลระบบ)', true));
        }
    });
};


/**
 * แจ้งเตือนแอดมินทางอีเมล เมื่อแม่บ้านส่งคำขอถอนเงินออกจาก Wallet
 * ไม่ผูกกับ bookings จึงแยกฟังก์ชันต่างหากจาก notifyBookingUpdate
 */
const notifyWithdrawalRequested = (maidId, amount, withdrawalId) => {
    if (!ADMIN_EMAIL) return;

    db.query('SELECT title_prefix, first_name, last_name FROM maids WHERE maid_id = ?', [maidId], (err, results) => {
        if (err || results.length === 0) return;
        const maid = results[0];
        const maidName = `${maid.title_prefix || ''}${maid.first_name || ''} ${maid.last_name || ''}`.trim() || `แม่บ้าน #${maidId}`;

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #006664; padding: 25px 20px; text-align: center; color: white;">
                    <h2 style="margin: 0; font-size: 20px;">แม่บ้านส่งคำขอถอนเงิน</h2>
                    <p style="margin: 5px 0 0 0; color: #B2BB1E; font-size: 14px;">รหัสคำขอ #${withdrawalId}</p>
                </div>
                <div style="padding: 25px 20px; color: #334155; line-height: 1.6; font-size: 15px;">
                    <p style="margin-top: 0;"><b>เรียน แอดมิน (ผู้ดูแลระบบ)</b></p>
                    <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #006664; margin-bottom: 20px;">
                        พนักงาน <b>${maidName}</b> ได้ส่งคำขอถอนเงินออกจาก Wallet จำนวน <b style="color:#006664; font-size:18px;">${formatPrice(amount)} บาท</b><br><br>
                        กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติคำขอถอนเงินค่ะ
                    </div>
                    <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 25px 0;">
                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 0;">นี่คืออีเมลอัตโนมัติจากระบบ KUCSC Clean</p>
                </div>
            </div>
        `;
        sendEmail(ADMIN_EMAIL, `[Admin แจ้งเตือน] แม่บ้านขอถอนเงิน (รหัส #${withdrawalId})`, html);
    });
};

module.exports = { notifyBookingUpdate, notifyWithdrawalRequested };
