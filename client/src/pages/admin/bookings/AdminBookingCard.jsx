import React, { useState } from 'react';
import { Calendar, MapPin, User, MessageSquareText, AlertCircle, Clock, CheckCircle, FileText, MessageSquare, XCircle, AlertTriangle, Mail, Phone, ChevronDown, X, Camera } from 'lucide-react';
import { formatDateTime } from '../../../utils/helpers';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

// ชื่อภาษาไทยของโซนบริการ (รหัสโซนในฐานข้อมูล → ข้อความที่แสดง)
const SERVICE_LABELS = {
    bedroom: 'ทำความสะอาดห้องนอน',
    bathroom: 'ขัดล้างห้องน้ำ',
    balcony: 'ทำความสะอาดระเบียง',
    kitchen: 'ทำความสะอาดโซนครัว',
    fridge: 'ล้างทำความสะอาดตู้เย็น',
    laundry: 'ซักผ้า-ตากผ้า',
    ironing: 'รีดผ้า',
};

// เดาว่าใครเป็นคนยกเลิก จากข้อความเหตุผลที่ยกเลิก (cancel_reason) เพื่อแสดงป้ายที่เหมาะสม
const getCancelDetails = (note) => {
    const text = note || '';
    if (text.includes('ผู้ใช้')) return { who: 'ลูกค้ายกเลิก', color: 'bg-slate-100 text-slate-600 border-slate-300', icon: <User size={12} /> };
    if (text.includes('แม่บ้าน')) return { who: 'แม่บ้านปฏิเสธงาน', color: 'bg-red-50 text-red-600 border-red-300', icon: <AlertTriangle size={12} /> };
    if (text.includes('แอดมิน') || text.includes('ยกเลิกโดย')) return { who: 'แอดมินยกเลิก', color: 'bg-stone-100 text-stone-600 border-stone-300', icon: <XCircle size={12} /> };
    return { who: 'ยกเลิกคำขอ', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle size={12} /> };
};

// สถานะที่นับว่าการจองถูกยกเลิกแล้ว
const isCancelledStatus = (status) => ['cancelled', 'cancelled_by_timeout', 'cancelled_by_admin', 'cancelled_no_maid', 'cancelled_no_show', 'refunded'].includes(status);

// ประเภทปัญหาที่แม่บ้านแจ้งเข้ามา (reason_type ที่ขึ้นต้นด้วย maid_) → ข้อความภาษาไทย
const MAID_REPORT_LABELS = {
    maid_no_contact: 'ติดต่อผู้ว่าจ้างไม่ได้',
    maid_location_not_found: 'หาพิกัดสถานที่ปฏิบัติงานไม่พบ',
    maid_unsafe_site: 'สภาพหน้างานไม่ปลอดภัย/ไม่ตรงกับที่ระบุ',
    maid_sudden_cancel: 'ผู้ว่าจ้างขอยกเลิกกะทันหันที่หน้างาน',
    maid_other: 'อื่นๆ (แม่บ้านระบุเอง)',
};
const isMaidReportType = (type) => MAID_REPORT_LABELS.hasOwnProperty(type);

// ข้อความของเหตุผลที่แจ้งปัญหา/ขอคืนเงิน
const getReasonLabel = (type) => {
    if (MAID_REPORT_LABELS[type]) return MAID_REPORT_LABELS[type];
    switch (type) {
        case 'no_show': return 'แม่บ้านไม่มาตามนัดหมาย';
        case 'refund_request': return 'คำขอคืนเงิน';
        default: return 'ปัญหาอื่นๆ';
    }
};

// ป้ายสถานะงาน (สี + ข้อความ) ตาม bookings.status — คืน null = ไม่ต้องแสดงป้าย
const getJobStatusBadge = (status, note = '', assignedMaids = []) => {
    switch (status) {
        case 'completed': return { text: 'งานเสร็จสิ้น', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
        case 'confirmed': return null;
        case 'in_progress': return { text: 'กำลังให้บริการ', color: 'bg-sky-50 text-sky-600 border-sky-200' };
        case 'waiting_maid': return { text: 'รอพนักงานตอบรับ', color: 'bg-orange-50 text-orange-600 border-orange-200' };
        case 'waiting_payment': return null;
        case 'no_show_reported': return { text: 'แม่บ้านไม่มาตามนัด', color: 'bg-red-50 text-red-600 border-red-200', isNoShow: true, cancelIcon: <AlertTriangle size={12} /> };
        case 'refund_requested': return { text: 'ลูกค้าขอคืนเงิน', color: 'bg-rose-50 text-rose-600 border-rose-200', cancelIcon: <AlertTriangle size={12} /> };
        case 'maid_reported': return { text: 'แม่บ้านแจ้งปัญหา', color: 'bg-amber-50 text-amber-700 border-amber-200', cancelIcon: <AlertTriangle size={12} /> };
        case 'cancelled_no_maid': return { text: 'ยกเลิก: ไม่มีพนักงานรับงาน', color: 'bg-amber-50 text-amber-700 border-amber-200', isCancelled: true, cancelIcon: <AlertTriangle size={12} /> };
        case 'cancelled_no_show': return { text: 'ยกเลิก: ยืนยันแม่บ้านไม่มา', color: 'bg-red-50 text-red-700 border-red-200', isCancelled: true, cancelIcon: <AlertTriangle size={12} /> };
        case 'cancelled_by_timeout': return { text: 'ยกเลิก: หมดเวลาชำระเงิน', color: 'bg-rose-50 text-rose-700 border-rose-200', isCancelled: true, cancelIcon: <Clock size={12} /> };
        case 'cancelled': const cancelInfo = getCancelDetails(note); return { text: cancelInfo.who, color: cancelInfo.color, isCancelled: true, cancelIcon: cancelInfo.icon };
        case 'verifying_payment': return null;
        default: {
            // status ว่างหรือไม่ตรงกับ case ใดเลย (ข้อมูลเก่า/ไม่สมบูรณ์) ให้เช็คจากข้อมูลแม่บ้านจริงแทน
            const activeMaids = assignedMaids.filter((m) => m.maid_status !== 'replaced');
            const allAccepted = activeMaids.length > 0 && activeMaids.every((m) => m.maid_status === 'accepted');
            if (allAccepted) return null;
            return { text: 'กำลังดำเนินการ', color: 'bg-slate-50 text-slate-600 border-slate-200' };
        }
    }
};

// ป้ายสถานะการชำระเงิน ตาม booking_payments.payment_status (paid / waiting_verify / rejected / รอชำระ)
const getPaymentStatusBadge = (booking, assignedMaids = []) => {
    if (isCancelledStatus(booking.status)) return null;
    if (booking.payment_status === 'paid') return { text: 'ตรวจสอบยอดเงินแล้ว', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle size={12} /> };
    if (booking.payment_status === 'waiting_verify') return { text: 'รอตรวจสลิป', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <FileText size={12} /> };
    if (booking.payment_status === 'rejected') return { text: 'การชำระเงินถูกปฏิเสธ', color: 'bg-rose-50 text-rose-700 border-rose-100', icon: <AlertCircle size={12} /> };
    
    const activeMaids = assignedMaids.filter((m) => m.maid_status !== 'replaced');
    const allAccepted = activeMaids.length > 0 && activeMaids.every((m) => m.maid_status === 'accepted');
    
    if (booking.status === 'waiting_payment' || (booking.payment_status === 'unpaid' && allAccepted)) {
        return { text: 'รอชำระเงิน', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Clock size={12} /> };
    }
    return null;
};

const AdminBookingCard = ({ booking: b, index, onVerifySlip, onViewReview, onSettleDispute, onCompleteRefund, onViewRefundSlip, onMarkRefundPaid, onViewEvidence }) => {
    // expanded = การ์ดถูกขยายอยู่ไหม, showMarkPaidConfirm = เปิดป๊อปอัปยืนยันโอนเงินคืนไหม
    const [expanded, setExpanded] = useState(false);
    const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
    useLockBodyScroll(showMarkPaidConfirm);
    const { date, time } = formatDateTime(b.booking_date);
    const isCancelled = isCancelledStatus(b.status);
    // ป้ายสถานะการคืนเงิน (แสดงแทนป้ายสถานะงานเมื่อแอดมินตัดสินคืนเงินแล้ว)
    const getRefundBadge = () => {
        if (b.refund_status !== 'refunded') return null;
        // ไม่มีเงินคืนลูกค้าเลย (เช่น ชดเชยแม่บ้านอย่างเดียว) ถือว่าจบเคสตั้งแต่ตัดสิน ไม่ต้องรอโอนอะไรเพิ่ม
        if (!b.customer_refund_status || Number(b.refund_amount) <= 0) {
            return { text: 'คืนเงินแล้ว', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', cancelIcon: <CheckCircle size={12} /> };
        }
        // มีเงินที่ต้องคืนลูกค้า แต่ตอนนี้แค่ชดเชยแม่บ้านไปแล้วเท่านั้น ห้ามบอกว่า "คืนเงินแล้ว" เพราะลูกค้ายังไม่ได้เงิน
        if (b.customer_refund_status === 'paid') {
            return { text: 'คืนเงินแล้ว', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', cancelIcon: <CheckCircle size={12} /> };
        }
        if (b.customer_refund_status === 'ready') {
            return { text: 'รอโอนเงินคืน', color: 'bg-amber-50 text-amber-700 border-amber-200', cancelIcon: <Clock size={12} /> };
        }
        return { text: 'รอลูกค้ากรอกบัญชี', color: 'bg-slate-100 text-slate-500 border-slate-200', cancelIcon: <Clock size={12} /> };
    };
    // ป้ายที่จะแสดงจริง: ถ้ามีป้ายคืนเงินใช้ป้ายคืนเงิน ไม่งั้นใช้ป้ายสถานะงาน
    const jobBadge = getRefundBadge() || getJobStatusBadge(b.status, b.cancel_reason, b.assigned_maids);
    const paymentBadge = getPaymentStatusBadge(b, b.assigned_maids);

    const selectedZones = Array.isArray(b.zones) ? b.zones : [];
    // ชื่อหอพักที่ลูกค้าเลือกจริงอยู่ในส่วนแรกของ location (ดู buildLocationString ใน UserBookingTab.jsx)
    // ไม่ใช้ dorm_type เพราะบอกได้แค่ราคานิสิต/บุคลากร ไม่ได้บอกว่าเป็นหอพักตึกไหน
    const dormLabel = (b.location || '').split(' ชั้น ')[0] || 'หอพัก';

    const getThemeLine = () => {
        return 'bg-[#006664]';
    };

    // มีรายละเอียดให้ขยายดูไหม (ถ้าไม่มีจะไม่แสดงลูกศรขยาย)
    const hasExpandableContent = selectedZones.length > 0 || (b.assigned_maids && b.assigned_maids.length > 0) || !isCancelled || (b.customer_note && b.customer_note !== '-') || (!isCancelled && b.payment_status === 'rejected' && b.admin_note) || b.review || b.reason_type;

    // Primary action button ที่ตรงกับสถานะปัจจุบัน (ปุ่มเดียว มองเห็นได้ทันทีโดยไม่ต้องขยายการ์ด)
    // แต่ละเงื่อนไขเป็นอิสระจากกัน หลายปุ่มโผล่พร้อมกันได้ (เช่น ปิดงานแบบมีเงินคืนที่จ่ายไปแล้ว
    // ยังต้องดูสลิปที่ลูกค้าเคยจ่ายไว้ตอนแรกได้ด้วย ไม่ใช่แค่ปุ่มโอนเงินคืนปุ่มเดียว)
    const renderPrimaryAction = () => {
        const actions = [];

        if (b.refund_status === 'refunded' && b.customer_refund_status === 'ready') {
            actions.push(
                <button key="mark-paid" onClick={(e) => { e.stopPropagation(); setShowMarkPaidConfirm(true); }} className="shrink-0 px-5 py-2.5 bg-[#006664] hover:bg-[#005553] text-white rounded-full text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap">
                    ยืนยันโอนเงินคืนลูกค้า
                </button>
            );
        }
        if (b.refund_id && b.refund_status === 'requested' && onSettleDispute) {
            actions.push(
                <button key="settle" onClick={(e) => { e.stopPropagation(); onSettleDispute(b); }} className="shrink-0 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap">
                    พิจารณาคำขอคืนเงิน
                </button>
            );
        } else if (b.refund_status === 'requested' && onCompleteRefund) {
            actions.push(
                <button key="complete-refund" onClick={(e) => { e.stopPropagation(); onCompleteRefund(b); }} className="shrink-0 px-5 py-2.5 bg-[#006664] hover:bg-[#005553] text-white rounded-full text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap">
                    <FileText size={16} /> จัดการการคืนเงิน
                </button>
            );
        }
        if (b.payment_slip) {
            actions.push(
                <button key="slip" onClick={(e) => { e.stopPropagation(); onVerifySlip(b); }} className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all active:scale-[0.98] flex justify-center items-center gap-2 whitespace-nowrap ${!isCancelled && b.payment_status === 'rejected' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/80' : !isCancelled && b.payment_status === 'waiting_verify' ? 'bg-[#006664] hover:bg-[#005553] text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'}`}>
                    <FileText size={16} /> {isCancelled ? 'ดูสลิปลูกค้า' : b.payment_status === 'rejected' ? 'ดูสลิปที่ถูกปฏิเสธ' : b.payment_status === 'waiting_verify' ? 'ตรวจสลิปโอนเงิน' : 'ดูสลิปโอนเงิน'}
                </button>
            );
        }

        if (actions.length === 0) return null;
        return <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>;
    };

    return (
        <div className={`bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,102,100,0.06)] transition-all duration-500 overflow-hidden relative group`}>
            {/* แถบสีด้านซ้าย (แสดงเมื่อเอาเมาส์ชี้) */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-80 transition-opacity duration-300 ${getThemeLine()}`}></div>

            {/* ======================================================== */}
            {/* Collapsed header - คลิกเพื่อขยาย/ย่อดูรายละเอียด */}
            {/* ======================================================== */}
            <div
                className="flex flex-col gap-4 p-6 sm:p-8 cursor-pointer select-none"
                onClick={() => hasExpandableContent && setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[14px]">
                        {index + 1}
                    </span>
                    <h3 className="text-[18px] font-bold text-slate-800 line-clamp-1">{dormLabel}</h3>
                    <span className="px-2.5 py-1 bg-teal-50 text-[#006664] text-[12px] font-bold rounded-full border border-teal-100 shrink-0">
                        ID: #{b.id || b.booking_id}
                    </span>
                    {hasExpandableContent && (
                        <ChevronDown size={20} className={`ml-auto shrink-0 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-slate-500 text-[14px]">
                    <span className="flex items-center gap-1.5 shrink-0">
                        <Calendar size={16} className="text-slate-400 shrink-0" /> {date} {time}
                    </span>
                    <span className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={16} className="text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{b.location || b.address || 'ไม่ระบุสถานที่'}</span>
                        {b.lat && b.lng && (
                            <a 
                                href={`https://www.google.com/maps?q=${b.lat},${b.lng}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors text-[11px] font-bold shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                title="เปิดดูตำแหน่งใน Google Maps"
                            >
                                <MapPin size={10} /> ดูพิกัด
                            </a>
                        )}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                        <User size={16} className="text-slate-400 shrink-0" /> {b.user_name || b.customer_name || 'ไม่มีชื่อลูกค้า'}
                    </span>
                </div>

                {selectedZones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedZones.map((zId) => (
                            <span key={zId} className="inline-block px-2.5 py-1 bg-teal-50/60 text-[#006664] text-[12px] font-bold rounded-full border border-teal-100">
                                {SERVICE_LABELS[zId] || zId}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        {paymentBadge && (
                            <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border flex items-center gap-1.5 w-fit shadow-sm bg-opacity-50 ${paymentBadge.color}`}>
                                {paymentBadge.icon} {paymentBadge.text}
                            </span>
                        )}
                        {jobBadge && (
                            <span className={`px-3 py-1.5 rounded-full text-[12px] font-bold border flex items-center gap-1.5 w-fit shadow-sm bg-opacity-50 ${jobBadge.color}`}>
                                {jobBadge.cancelIcon} {jobBadge.text}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <div className={`text-xl leading-none font-extrabold tracking-normal ${isCancelled && b.refund_status !== 'requested' ? 'text-slate-500' : 'text-[#006664]'}`}>
                            ฿{parseFloat(b.total_price || 0).toFixed(2)}
                        </div>
                        {renderPrimaryAction()}
                    </div>
                </div>
            </div>

            {/* ======================================================== */}
            {/* Expanded body - รายละเอียดเพิ่มเติม */}
            {/* ======================================================== */}
            {expanded && hasExpandableContent && (
                <div className="px-6 sm:px-8 pb-5 pt-1 border-t border-slate-100 divide-y divide-slate-100 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>

                    {/* ข้อมูลติดต่อลูกค้า */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 py-3 text-[13px] text-slate-600">
                        <a href={`mailto:${b.user_email || b.email}`} className="flex items-center gap-2 hover:text-[#006664] truncate">
                            <Mail size={14} className="text-slate-400 shrink-0" /> {b.user_email || b.email || '-'}
                        </a>
                        <span className="flex items-center gap-2 font-mono">
                            <Phone size={14} className="text-slate-400 shrink-0" /> {b.customer_phone || b.phone || '-'}
                        </span>
                    </div>

                    {/* แม่บ้านที่รับงาน หรือสถานะยังไม่มีแม่บ้าน */}
                    <div className="flex flex-wrap items-center gap-1.5 py-3">
                        {b.assigned_maids && b.assigned_maids.length > 0 ? (
                            b.assigned_maids.filter((m) => m.maid_status !== 'replaced').map((maid, idx) => {
                                const name = `${maid.title_prefix || ''}${maid.first_name || ''} ${maid.last_name || ''}`.trim() || `แม่บ้าน #${maid.maid_id}`;
                                const status = maid.maid_status;
                                let statusColor, statusText;
                                if (status === 'accepted') { statusColor = 'text-[#006664] bg-[#006664]/5 border-[#006664]/20'; statusText = 'พนักงานรับงาน'; }
                                else if (status === 'rejected') { statusColor = 'text-red-500 bg-red-50 border-red-200'; statusText = 'ปฏิเสธงาน'; }
                                else { statusColor = 'text-orange-500 bg-orange-50 border-orange-200'; statusText = 'รอตอบรับ'; }

                                return (
                                    <span key={idx} className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[12px] border ${isCancelled ? 'text-slate-500 bg-slate-200/50 border-slate-300' : statusColor}`}>
                                        <User size={12} /> {name} <span className="text-[10px] font-medium">({statusText})</span>
                                    </span>
                                );
                            })
                        ) : (
                            <span className={`flex items-center gap-2 text-[13px] font-medium ${isCancelled ? 'text-slate-500' : 'text-amber-600'}`}>
                                <span className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`}></span>
                                ยังไม่มีพนักงานรับงาน
                            </span>
                        )}
                    </div>

                    {/* หมายเหตุจากลูกค้า */}
                    {b.customer_note && b.customer_note !== "-" && (
                        <div className="flex items-start gap-2 py-3 text-[13px]">
                            <MessageSquareText size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <span className="text-slate-600 leading-relaxed">"{b.customer_note}"</span>
                        </div>
                    )}

                    {/* Dispute Report - เหตุผลที่ลูกค้าแจ้งเข้ามา + ผลการตัดสิน (ถ้ามี) */}
                    {b.reason_type && (
                        <div className="py-3">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{isMaidReportType(b.reason_type) ? 'เรื่องที่แม่บ้านแจ้งเข้ามา' : 'เรื่องที่ลูกค้าแจ้งเข้ามา'}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${isMaidReportType(b.reason_type) ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {getReasonLabel(b.reason_type)}
                                    </span>
                                </div>
                                {b.reason_text && (
                                    <p className="text-[13px] text-slate-700 font-medium italic mb-2">"{b.reason_text}"</p>
                                )}
                                {b.evidence_images && (() => {
                                    try {
                                        const images = typeof b.evidence_images === 'string' ? JSON.parse(b.evidence_images) : b.evidence_images;
                                        if (Array.isArray(images) && images.length > 0) {
                                            return (
                                                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 custom-scrollbar">
                                                    {images.map((imgUrl, i) => (
                                                        <a key={i} href={`/backend-images${imgUrl}`} target="_blank" rel="noreferrer" className="shrink-0 block" title="ดูรูปภาพขนาดเต็ม">
                                                            <img src={`/backend-images${imgUrl}`} alt="evidence" className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                                                        </a>
                                                    ))}
                                                </div>
                                            );
                                        }
                                    } catch(e) { return null; }
                                    return null;
                                })()}
                                {b.refund_status === 'refunded' && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
                                            <CheckCircle size={13} /> ผลการตัดสิน: คืนเงินลูกค้า ฿{parseFloat(b.refund_amount || 0).toFixed(2)}
                                        </div>
                                        {b.compensation_amount != null && Number(b.compensation_amount) !== 0 && (
                                            <p className={`text-[12px] font-bold mt-0.5 pl-[19px] ${Number(b.compensation_amount) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {Number(b.compensation_amount) > 0
                                                    ? `ชดเชยแม่บ้าน ฿${Number(b.compensation_amount).toFixed(2)}`
                                                    : `หักยอดวอลเลทแม่บ้าน ฿${Math.abs(Number(b.compensation_amount)).toFixed(2)}`}
                                            </p>
                                        )}
                                        {b.refund_admin_note && (
                                            <p className="text-[11px] text-slate-500 mt-1 pl-[19px]">หมายเหตุแอดมิน: {b.refund_admin_note}</p>
                                        )}
                                    </div>
                                )}
                                {b.refund_status === 'rejected' && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 pt-2 border-t border-slate-200">
                                        <XCircle size={13} /> ผลการตัดสิน: ปฏิเสธคำขอคืนเงิน
                                    </div>
                                )}
                                {b.refund_status === 'requested' && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 pt-2 border-t border-slate-200">
                                        <Clock size={13} /> สถานะ: รอพิจารณา
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* กล่องแจ้งเหตุผล — แสดงเฉพาะตอนสลิปถูกปฏิเสธ (ไม่แสดงตอนยกเลิกทั่วไป) */}
                    {!isCancelled && b.payment_status === 'rejected' && b.admin_note && (
                        <div className="py-3">
                            <div className="flex items-start gap-3 bg-rose-50/80 border border-rose-100/80 p-3 rounded-xl">
                                <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-bold text-rose-700">
                                        {isCancelled ? 'เหตุผลการยกเลิก' : 'สลิปไม่ผ่านการตรวจสอบ'}
                                    </span>
                                    <span className="text-[13px] text-rose-600/90 leading-relaxed font-medium">
                                        {b.admin_note.replace('แอดมินยกเลิก: ', '')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ปุ่มรอง: ดูรีวิว / ดูรูปผลงาน */}
                    {(b.review || b.job_photos_count > 0) && (
                        <div className="py-3 flex gap-2">
                            {b.review && (
                                <button onClick={() => onViewReview(b.review)} className="flex-1 py-2.5 bg-white text-[#006664] hover:bg-teal-50 border border-slate-200 hover:border-teal-100 rounded-full text-[13px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <MessageSquare size={14} /> ดูรีวิวลูกค้า
                                </button>
                            )}
                            {b.job_photos_count > 0 && (
                                <button onClick={() => onViewEvidence && onViewEvidence(b.booking_id)} className="flex-1 py-2.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full text-[13px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <Camera size={14} /> ดูรูปผลงานแม่บ้าน
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ป็อปอัพยืนยันโอนเงินคืนลูกค้า - โชว์บัญชีที่ลูกค้ากรอกไว้ก่อนกดยืนยัน */}
            {showMarkPaidConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowMarkPaidConfirm(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full relative overflow-hidden border border-slate-100" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowMarkPaidConfirm(false)} className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full z-10 transition-colors">
                            <X size={16} />
                        </button>
                        <div className="p-6 pb-5">
                            <h3 className="font-bold text-[17px] text-slate-800 leading-snug">ยืนยันโอนเงินคืนลูกค้า</h3>
                            <p className="text-[12px] text-slate-400 font-medium mt-1">หมายเลขการจอง #{b.booking_id}</p>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">บัญชีที่ลูกค้าแจ้งไว้</p>
                                <p className="text-[13px] font-bold text-slate-700">{b.refund_bank_name}</p>
                                <p className="text-[15px] font-mono font-extrabold text-slate-800 mt-0.5">{b.refund_account_number}</p>
                                <p className="text-[12px] text-slate-500 mt-0.5">ชื่อบัญชี: {b.refund_account_name}</p>
                                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-[12px] text-slate-500 font-medium">ยอดคืนเงิน</span>
                                    <span className="text-[20px] font-extrabold text-[#006664]">฿{parseFloat(b.refund_amount || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <button
                                onClick={() => { onMarkRefundPaid && onMarkRefundPaid(b.refund_id); setShowMarkPaidConfirm(false); }}
                                className="w-full py-3.5 bg-[#006664] hover:bg-[#005553] text-white rounded-2xl font-extrabold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,102,100,0.2)]"
                            >
                                <CheckCircle size={16} /> ยืนยันโอนเงินคืนแล้ว
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBookingCard;