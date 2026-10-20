import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BoxSelect, ChevronDown } from 'lucide-react';

import AdminBookingCard from './bookings/AdminBookingCard';
import VerifySlipModal from './bookings/modals/VerifySlipModal';

import ViewReviewModal from './bookings/modals/ViewReviewModal';
import UploadRefundSlipModal from './bookings/modals/UploadRefundSlipModal';
import ViewRefundSlipModal from './bookings/modals/ViewRefundSlipModal';
import SettleDisputeModal from './bookings/modals/SettleDisputeModal';
import EvidenceModal from '../user/modals/EvidenceModal';

const AdminBookingsTab = ({ notify, requestConfirm }) => {
    // ข้อมูลการจองทั้งหมด, คำค้นหา, แท็บกรองที่เลือก, และมุมมองย่อยของแท็บคืนเงิน (รอดำเนินการ/ดำเนินการแล้ว)
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [refundViewMode, setRefundViewMode] = useState('pending');
    const [isRefundDropdownOpen, setIsRefundDropdownOpen] = useState(false);

    // ปิดเมนูย่อยของแท็บ "คืนเงิน" เมื่อเปลี่ยนไปแท็บอื่น
    useEffect(() => {
        if (filterStatus !== 'refund') setIsRefundDropdownOpen(false);
    }, [filterStatus]);

    // แท็บกรองด้านบน (id ใช้ในตัวกรองด้านล่าง)
    const FILTER_TABS = [
        { id: 'all', label: 'ทั้งหมด' },
        { id: 'waiting_maid', label: 'รอพนักงาน' },
        { id: 'waiting_payment', label: 'รอชำระเงิน' },
        { id: 'need_verify', label: 'รอตรวจสลิป' },
        { id: 'cancelled', label: 'ยกเลิก' },
        { id: 'refund', label: 'คืนเงิน' }
    ];

    // state ของป๊อปอัปแต่ละแบบ: มีค่า = เปิดป๊อปอัปนั้นอยู่ (เก็บการจองที่กำลังจัดการ)
    const [verifyBooking, setVerifyBooking] = useState(null);
    const [reviewText, setReviewText] = useState(null);
    const [refundModalBooking, setRefundModalBooking] = useState(null);
    const [viewRefundSlip, setViewRefundSlip] = useState(null);
    const [settleDisputeBooking, setSettleDisputeBooking] = useState(null);
    const [jobPhotos, setJobPhotos] = useState([]);
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

    // ดูรูปผลงาน before/after ของแม่บ้าน (GET /api/maid/job-photos/:bookingId)
    const handleViewEvidence = async (bookingId) => {
        try {
            const res = await axios.get(`/api/maid/job-photos/${bookingId}`);
            if (res.data.length === 0) { notify('error', 'แม่บ้านยังไม่ได้อัปโหลดรูปภาพผลงาน'); return; }
            setJobPhotos(res.data);
            setEvidenceModalOpen(true);
        } catch (err) { notify('error', 'ไม่สามารถโหลดรูปภาพได้'); }
    };

    // ล็อกการเลื่อนหน้าเว็บเมื่อมีป๊อปอัปเปิดอยู่
    useEffect(() => {
        const isAnyModalOpen = verifyBooking !== null || reviewText !== null || refundModalBooking !== null || viewRefundSlip !== null || evidenceModalOpen;
        document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [verifyBooking, reviewText, refundModalBooking, viewRefundSlip, evidenceModalOpen]);

    // โหลดการจองทั้งหมด (ตัดรายการซ้ำด้วย booking_id) — เรียกซ้ำทุกครั้งหลังแอดมินทำรายการเสร็จ
    const fetchAll = () => {
        axios.get('/api/admin/bookings').then(res => {
            const uniqueBookings = Array.from(new Map(res.data.map(item => [item.booking_id || item.id, item])).values());
            const formatted = uniqueBookings.map((b) => ({ ...b, id: b.booking_id || b.id }));
            setBookings(formatted);
        }).catch(err => notify('error', 'Error', 'ไม่สามารถโหลดข้อมูลการจองได้'));
    };
    useEffect(() => { fetchAll(); }, []);

    // --- ฟังก์ชันจัดกลุ่มสถานะ ใช้ทั้งตอนกรองและตอนนับตัวเลขบนแท็บ ---
    // มีแม่บ้านรับงานครบแล้วหรือยัง
    const checkAllMaidsAccepted = (b) => {
        const active = b.assigned_maids ? b.assigned_maids.filter((m) => m.maid_status !== 'replaced') : [];
        return active.length > 0 && active.every((m) => m.maid_status === 'accepted');
    };

    // สถานะที่นับว่า "ยกเลิก" และเงื่อนไขที่นับว่าเป็นเรื่อง "คืนเงิน/แจ้งปัญหา"
    const isCancelledStatus = (status) => ['cancelled', 'cancelled_by_timeout', 'cancelled_by_admin', 'cancelled_no_maid', 'cancelled_no_show', 'refunded'].includes(status);
    const isRefundItem = (b) => ['requested', 'refunded', 'rejected'].includes(b.refund_status) || b.status === 'refunded' || b.status === 'no_show_reported' || b.no_show_status === 'reported';
    // refund_status = 'refunded' คือแอดมิน "ตัดสินใจ" แล้วเท่านั้น ไม่ได้แปลว่าลูกค้าได้เงินคืนจริง
    // ถ้ายังรอลูกค้ากรอกบัญชี/รอโอน (customer_refund_status ยังไม่ paid) ต้องนับเป็น "รอดำเนินการ" อยู่
    const isRefundDone = (b) => b.refund_status === 'rejected' || (b.refund_status === 'refunded' && (!b.customer_refund_status || Number(b.refund_amount) <= 0 || b.customer_refund_status === 'paid'));
    const isRefundPending = (b) => isRefundItem(b) && !isRefundDone(b);
    const isCancelItem = (b) => isCancelledStatus(b.status) && !isRefundItem(b);

    // กรองตามคำค้นหา (ชื่อ, รหัสผู้ใช้, รหัสการจอง, เบอร์, อีเมล, ชื่อแม่บ้าน) และตามแท็บที่เลือก
    const filteredBookings = bookings.filter(b => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
            (b.user_name || '').toLowerCase().includes(term) ||
            (b.user_id || '').toLowerCase().includes(term) ||
            (b.booking_id || b.id?.toString() || '').toLowerCase().includes(term) ||
            (b.customer_phone || b.phone || '').includes(term) ||
            (b.email || '').toLowerCase().includes(term) ||
            (b.maid_name || '').toLowerCase().includes(term);
        let matchFilter = true;
        if (filterStatus === 'need_verify') matchFilter = b.payment_status === 'waiting_verify' && !isCancelledStatus(b.status);
        if (filterStatus === 'waiting_payment') matchFilter = (b.status === 'waiting_payment' && b.payment_status !== 'waiting_verify') || (b.payment_status === 'unpaid' && checkAllMaidsAccepted(b)) || (b.payment_status === 'rejected' && !isCancelledStatus(b.status));
        if (filterStatus === 'waiting_maid') matchFilter = b.status === 'waiting_maid' && !isCancelledStatus(b.status) && !checkAllMaidsAccepted(b);
        if (filterStatus === 'cancelled') matchFilter = isCancelItem(b);
        if (filterStatus === 'refund') matchFilter = isRefundItem(b) && (refundViewMode === 'pending' ? isRefundPending(b) : isRefundDone(b));
        return matchSearch && matchFilter;
    });

    // นับจำนวนของแต่ละแท็บไว้แสดงเป็นตัวเลข
    const countNeedVerify = bookings.filter(b => b.payment_status === 'waiting_verify' && !isCancelledStatus(b.status)).length;
    const countWaitingPayment = bookings.filter(b => (b.status === 'waiting_payment' && b.payment_status !== 'waiting_verify') || (b.payment_status === 'unpaid' && checkAllMaidsAccepted(b)) || (b.payment_status === 'rejected' && !isCancelledStatus(b.status))).length;
    const countWaitingMaid = bookings.filter(b => b.status === 'waiting_maid' && !isCancelledStatus(b.status) && !checkAllMaidsAccepted(b)).length;
    const countCancelled = bookings.filter(b => isCancelItem(b)).length;
    const countRefund = bookings.filter(b => isRefundItem(b)).length;
    const countRefundPending = bookings.filter(b => isRefundPending(b)).length;
    const countRefundDone = bookings.filter(b => isRefundDone(b)).length;

    const filterCounts = {
        'all': bookings.length,
        'waiting_maid': countWaitingMaid,
        'waiting_payment': countWaitingPayment,
        'need_verify': countNeedVerify,
        'cancelled': countCancelled,
        'refund': countRefund
    };


    // --- ฟังก์ชันที่ป๊อปอัป/การ์ดเรียกใช้ (เรียก API แล้วโหลดรายการใหม่ + แจ้งเตือน) ---
    // อนุมัติสลิป → PUT /api/bookings/:id/confirm-payment, ปฏิเสธสลิป (ต้องมีเหตุผล) → PUT /api/bookings/:id/reject-payment
    const confirmPayment = async (id) => { try { await axios.put(`/api/bookings/${id}/confirm-payment`); fetchAll(); notify('success', 'สำเร็จ', 'ยืนยันการชำระเงินแล้ว'); setVerifyBooking(null); } catch (err) { notify('error', 'ผิดพลาด', 'ยืนยันไม่สำเร็จ'); } };
    const handleRejectPayment = async (id, note) => { if (!note) return notify('error', 'ข้อผิดพลาด', 'กรุณาระบุเหตุผลที่ปฏิเสธการชำระเงิน'); try { await axios.put(`/api/bookings/${id}/reject-payment`, { note }); fetchAll(); notify('success', 'ปฏิเสธสำเร็จ', 'แจ้งเตือนผู้ใช้แล้ว'); setVerifyBooking(null); } catch (err) { notify('error', 'ผิดพลาด', 'ทำรายการไม่สำเร็จ'); } };


    // ปิดเรื่องคืนเงินแบบง่าย: คืน (refunded) หรือ ไม่คืน (rejected) → PUT /api/bookings/:id/refund-complete
    const handleCompleteRefund = async (id, status, adminNote) => {
        try {
            await axios.put(`/api/bookings/${id}/refund-complete`, {
                status,
                admin_note: adminNote
            });
            fetchAll();
            notify('success', status === 'refunded' ? 'อนุมัติการคืนเงินแล้ว' : 'ปฏิเสธการคืนเงินแล้ว',
                status === 'refunded' ? 'ระบบอัปเดตสถานะเป็นคืนเงินแล้วและแจ้งลูกค้าเรียบร้อย' : 'ระบบได้บันทึกเหตุผลการปฏิเสธและแจ้งลูกค้าแล้ว');
            setRefundModalBooking(null);
        } catch (err) {
            notify('error', 'ผิดพลาด', err?.response?.data?.error || 'ไม่สามารถทำรายการได้');
        }
    };

    // ตัดสินข้อพิพาท: กำหนดเงินคืนลูกค้า/เงินชดเชยแม่บ้าน → PUT /api/admin/refunds/:refundId/settle
    const handleSettleDispute = async (refundId, payload) => {
        try {
            await axios.put(`/api/admin/refunds/${refundId}/settle`, payload);
            fetchAll();
            notify('success', 'บันทึกผลการพิจารณาแล้ว', 'ระบบอัปเดตสถานะและยอดวอลเลทแม่บ้านเรียบร้อย');
            setSettleDisputeBooking(null);
        } catch (err) {
            notify('error', 'ผิดพลาด', err?.response?.data?.error || 'ไม่สามารถทำรายการได้');
        }
    };

    // แอดมินยืนยันว่าโอนเงินคืนลูกค้าแล้ว → PUT /api/admin/refunds/:refundId/mark-paid
    const handleMarkRefundPaid = async (refundId) => {
        try {
            await axios.put(`/api/admin/refunds/${refundId}/mark-paid`);
            fetchAll();
            notify('success', 'บันทึกแล้ว', 'ปิดรายการคืนเงินลูกค้าเรียบร้อย');
        } catch (err) {
            notify('error', 'ผิดพลาด', err?.response?.data?.error || 'ไม่สามารถทำรายการได้');
        }
    };

    // ลบการจอง → DELETE /api/bookings/:id (ตอนนี้ยังไม่มีปุ่มไหนเรียกฟังก์ชันนี้)
    return (
        <div className="space-y-6">

            {/* แถบค้นหาและตัวกรอง (ดีไซน์ใหม่ - Soft UI) */}
            <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8 border-b border-slate-200 pb-4">

                {/* ปุ่ม Filters (Pill Tabs) */}
                <div className="w-full lg:w-auto">
                    {/* มือถือ: แท็บอยู่บรรทัดเดียวและเลื่อนซ้าย-ขวาได้ / จอใหญ่: จัดบรรทัดเหมือนเดิม
                        (pb/-mb ให้เส้นขีดใต้แท็บที่เลือกไม่โดนตัดโดยพื้นที่เลื่อน) */}
                    <div className="flex flex-wrap gap-x-8 gap-y-2 px-2 max-lg:flex-nowrap max-lg:overflow-x-auto max-lg:pb-[17px] max-lg:-mb-[17px] max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden">
                        {FILTER_TABS.map((tab) => {
                            const isActive = filterStatus === tab.id;
                            const count = filterCounts[tab.id];

                            return (
                                <div key={tab.id} className="relative shrink-0">
                                    <button
                                        onClick={() => {
                                            setFilterStatus(tab.id);
                                            if (tab.id === 'refund') setIsRefundDropdownOpen(!isRefundDropdownOpen);
                                        }}
                                        className={`
                                            relative flex items-center gap-2 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300
                                            ${isActive ? 'text-[#006664]' : 'text-slate-500 hover:text-[#006664]/70'}
                                        `}
                                    >
                                        <span>{tab.label}</span>

                                        <span className={`
                                            px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-300
                                            ${isActive ? 'bg-[#006664] text-white shadow-sm shadow-[#006664]/20' : 'bg-slate-100 text-slate-500'}
                                        `}>
                                            {count}
                                        </span>

                                        {tab.id === 'refund' && (
                                            <ChevronDown size={14} className={`transition-transform duration-200 ${isRefundDropdownOpen ? 'rotate-180' : 'text-slate-400'}`} />
                                        )}

                                        {isActive && (
                                            <div className="absolute bottom-[-17px] left-0 right-0 h-[3.5px] bg-[#006664] rounded-t-full shadow-[0_-1px_4px_rgba(0,102,100,0.2)]" />
                                        )}
                                    </button>

                                    {/* เมนูย่อยของแท็บคืนเงิน: รอดำเนินการ / ดำเนินการแล้ว (จอใหญ่) */}
                                    {tab.id === 'refund' && isRefundDropdownOpen && (
                                        <div className="max-lg:hidden absolute top-full left-1/2 -translate-x-1/2 mt-5 w-48 bg-white rounded-[1.25rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100/60 p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                                            {[
                                                { id: 'pending', label: 'รอดำเนินการ', count: countRefundPending },
                                                { id: 'history', label: 'ดำเนินการแล้ว', count: countRefundDone },
                                            ].map((subTab) => {
                                                const isSubActive = refundViewMode === subTab.id;
                                                return (
                                                    <button
                                                        key={subTab.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRefundViewMode(subTab.id);
                                                            setIsRefundDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                                            isSubActive ? 'bg-[#f4fbfa] text-[#006664]' : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {subTab.label}
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                                                            isSubActive ? 'bg-white text-[#006664] shadow-sm' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {subTab.count}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* มือถือ: ตัวเลือกย่อยของ "คืนเงิน" แสดงเป็นแถวใต้แท็บ (เมนูลอยจะโดนพื้นที่เลื่อนตัด) */}
                    {isRefundDropdownOpen && filterStatus === 'refund' && (
                        <div className="lg:hidden flex gap-2 px-2 mt-4">
                            {[
                                { id: 'pending', label: 'รอดำเนินการ', count: countRefundPending },
                                { id: 'history', label: 'ดำเนินการแล้ว', count: countRefundDone },
                            ].map((subTab) => {
                                const isSubActive = refundViewMode === subTab.id;
                                return (
                                    <button
                                        key={subTab.id}
                                        onClick={() => {
                                            setRefundViewMode(subTab.id);
                                            setIsRefundDropdownOpen(false);
                                        }}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-bold border transition-all ${
                                            isSubActive ? 'bg-[#f4fbfa] text-[#006664] border-[#006664]/30' : 'text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {subTab.label}
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${isSubActive ? 'bg-white text-[#006664] shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                                            {subTab.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ช่องค้นหา */}
                <div className="relative w-full lg:w-[320px] shrink-0 self-end">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#006664]/60">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหา ID, ชื่อ, อีเมล..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 text-[14px] font-medium rounded-full outline-none focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/10 transition-all placeholder:font-normal"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>



            {/* รายการการ์ดการจองที่ผ่านตัวกรอง (ไม่มี = แสดงข้อความว่าไม่พบข้อมูล) */}
            <div className="space-y-4">

                {filteredBookings.length === 0 ? (
                    <div className="py-20 px-8 text-center flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        <div className="w-16 h-16 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] mb-6 shadow-inner">
                            <BoxSelect size={28} />
                        </div>
                        <h3 className="text-lg font-extrabold text-slate-800 mb-2">
                            {filterStatus === 'refund' ? 'ไม่พบข้อมูลการคืนเงิน' : 'ไม่พบข้อมูลการจอง'}
                        </h3>
                        <p className="text-[15px] font-medium text-slate-400">
                            {filterStatus === 'refund' 
                                ? 'ไม่มีรายการที่เกี่ยวข้องกับการคืนเงินในขณะนี้' 
                                : 'ไม่มีรายการจองที่ตรงกับเงื่อนไขการค้นหาของคุณในขณะนี้'}
                        </p>
                    </div>
                ) : filteredBookings.map((b, index) => (
                    <AdminBookingCard
                        key={b.id}
                        booking={b}
                        index={index}
                        onVerifySlip={() => setVerifyBooking(b)}
                        onViewReview={(text) => setReviewText(text)}
                        onSettleDispute={(booking) => setSettleDisputeBooking(booking)}
                        onCompleteRefund={(booking) => setRefundModalBooking(booking)}
                        onViewRefundSlip={(slip) => setViewRefundSlip(slip)}
                        onMarkRefundPaid={handleMarkRefundPaid}
                        onViewEvidence={handleViewEvidence}
                    />
                ))}
            </div>

            {/* ป๊อปอัปต่าง ๆ จะแสดงเมื่อ state ของมันมีค่า */}
            {verifyBooking && <VerifySlipModal booking={verifyBooking} onClose={() => setVerifyBooking(null)} onApprove={confirmPayment} onReject={handleRejectPayment} />}

            {reviewText && <ViewReviewModal reviewText={reviewText} onClose={() => setReviewText(null)} />}

            {refundModalBooking && <UploadRefundSlipModal booking={refundModalBooking} onClose={() => setRefundModalBooking(null)} onSubmit={handleCompleteRefund} />}
            {viewRefundSlip && <ViewRefundSlipModal slipPath={viewRefundSlip} onClose={() => setViewRefundSlip(null)} />}
            {settleDisputeBooking && <SettleDisputeModal booking={settleDisputeBooking} onClose={() => setSettleDisputeBooking(null)} onSubmit={handleSettleDispute} />}
            <EvidenceModal isOpen={evidenceModalOpen} onClose={() => setEvidenceModalOpen(false)} jobPhotos={jobPhotos} />
        </div>
    );
};

export default AdminBookingsTab;