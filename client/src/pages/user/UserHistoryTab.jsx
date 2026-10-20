import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, CheckCircle, AlertCircle, ClipboardList, Home, HelpCircle } from 'lucide-react';

import PaymentModal from './modals/PaymentModal';
import EvidenceModal from './modals/EvidenceModal';
import ReviewModal from './modals/ReviewModal';
import RefundModal from './modals/RefundModal';
import ViewRefundSlipModal from './modals/ViewRefundSlipModal';
import UserBookingCard from './history/UserBookingCard';

const UserHistoryTab = ({ user, requestConfirm, statusMsg, setStatusMsg, goToBooking }) => {
    // รายการจอง + state ของป๊อปอัปแต่ละแบบ (มีค่า = เปิดป๊อปอัปนั้นสำหรับการจองนั้น)
    const [history, setHistory] = useState([]);
    const [payModal, setPayModal] = useState(null);
    const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
    const [jobPhotos, setJobPhotos] = useState([]);
    const [reviewModal, setReviewModal] = useState(null);

    const [refundModal, setRefundModal] = useState(null);
    const [bankInfoModal, setBankInfoModal] = useState(null);
    const [viewRefundSlip, setViewRefundSlip] = useState(null);
    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    // โหลดประวัติการจอง: สั่ง cron ตรวจการจองที่หมดเวลาก่อน (ให้สถานะเป็นปัจจุบัน)
    // แล้วค่อยดึงรายการจองของผู้ใช้ และตัดรายการซ้ำด้วย booking_id
    const fetchHistory = async () => {
        try {
            await Promise.all([
                axios.post('/api/cron/check-expired-payments').catch(console.error),
                axios.post('/api/cron/check-no-maid-expiry').catch(console.error)
            ]);

            if (!user?.user_id) return;
            const res = await axios.get(`/api/my-bookings/${user.user_id}`);
            const uniqueHistory = Array.from(new Map(res.data.map(item => [item.booking_id, item])).values());
            setHistory(uniqueHistory);
        } catch (error) {
            console.error('Failed to fetch history', error);
            setStatusMsg({ type: 'error', text: `Fetch Error: ${error.message} - ${error.response?.status} - ${JSON.stringify(error.response?.data || {})}` });
        }

    };

    // โหลดทันทีตอนเปิดหน้า และโหลดซ้ำทุก 60 วินาที
    useEffect(() => {
        if (!user?.user_id) return;

        fetchHistory();
        const interval = setInterval(fetchHistory, 60000);
        return () => clearInterval(interval);
    }, [user?.user_id]);

    // แสดงข้อความแจ้งผลด้านบน 4 วินาที
    const showMessage = (type, text) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 4000);
    };

    // --- ฟังก์ชันทำรายการ (เรียก API แล้วโหลดประวัติใหม่) ---
    // ยกเลิกการจอง (ถามยืนยันก่อน) → PUT /api/bookings/:id/status
    const cancelBooking = async (id) => {
        requestConfirm('ยกเลิกบริการ?', 'ยืนยันการยกเลิกการจองนี้ใช่หรือไม่?', async () => {
            try {
                await axios.put(`/api/bookings/${id}/status`, { status: 'cancelled', note: 'ยกเลิกโดยผู้ใช้' });
                showMessage('success', 'ยกเลิกการจองเรียบร้อยแล้ว');
                fetchHistory();
            } catch (err) { showMessage('error', 'ไม่สามารถยกเลิกได้'); }
        }, 'danger');
    };

    // อัปโหลดสลิปชำระเงิน → POST /api/bookings/:id/pay (form-data ฟิลด์ slip)
    const handleUploadSlip = async (slipFile, bookingId) => {
        const formData = new FormData(); formData.append('slip', slipFile);
        try {
            await axios.post(`/api/bookings/${bookingId}/pay`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showMessage('success', 'แจ้งโอนเงินสำเร็จ รอการตรวจสอบ');
            setPayModal(null);
            fetchHistory();
        } catch (err) { showMessage('error', 'อัปโหลดสลิปไม่สำเร็จ'); }
    };

    // ดูรูปผลงาน before/after → GET /api/maid/job-photos/:bookingId
    const handleViewEvidence = async (bookingId) => {
        try {
            const res = await axios.get(`/api/maid/job-photos/${bookingId}`);
            if (res.data.length === 0) { showMessage('error', 'แม่บ้านยังไม่ได้อัปโหลดรูปภาพผลงาน'); return; }
            setJobPhotos(res.data);
            setEvidenceModalOpen(true);
        } catch (err) { showMessage('error', 'ไม่สามารถโหลดรูปภาพได้'); }
    };

    // ส่งรีวิว → POST /api/user/bookings/:id/review
    const submitReview = async (bookingId, { rating, review }) => {
        try {
            await axios.post(`/api/user/bookings/${bookingId}/review`, { rating, review });
            showMessage('success', 'ส่งรีวิวเรียบร้อยแล้ว ขอบคุณค่ะ');
            setReviewModal(null);
            fetchHistory();
        } catch (err) { showMessage('error', err?.response?.data?.error || 'ส่งรีวิวไม่สำเร็จ'); }
    };

    // แจ้งปัญหา/ขอคืนเงิน พร้อมรูปหลักฐาน → POST /api/bookings/:id/refund-report
    const submitRefundReport = async (bookingId, payload) => {
        try {
            // payload: { reason_type, reason_text, bank_name, account_number, account_name, evidences (Array) } — ข้อมูลจากฟอร์มแจ้งปัญหา
            const formData = new FormData();
            formData.append('user_id', user.user_id);
            formData.append('reason_type', payload.reason_type);
            formData.append('reason_text', payload.reason_text || '');
            if (payload.bank_name) formData.append('bank_name', payload.bank_name);
            if (payload.account_number) formData.append('account_number', payload.account_number);
            if (payload.account_name) formData.append('account_name', payload.account_name);
            
            if (payload.evidences && payload.evidences.length > 0) {
                payload.evidences.forEach(file => {
                    formData.append('evidences', file);
                });
            }

            await axios.post(`/api/bookings/${bookingId}/refund-report`, formData);
            
            const msgMap = {
                'no_show': 'ส่งรายงานแม่บ้านไม่มาเรียบร้อยแล้ว แอดมินจะตรวจสอบและคืนเงินให้คุณ',
                'refund_request': 'ส่งคำขอคืนเงินเรียบร้อยแล้ว แอดมินจะดำเนินการตรวจสอบข้อมูล'
            };
            
            showMessage('success', msgMap[payload.reason_type] || 'ส่งรายงานเรียบร้อยแล้ว');
            setRefundModal(null);
            fetchHistory();
        } catch (err) {
            showMessage('error', err?.response?.data?.error || 'ส่งรายงานไม่สำเร็จ');
        }
    };

    // กรอกบัญชีธนาคารเพื่อรับเงินคืน → PUT /api/bookings/:id/refund-bank-info
    const handleSubmitBankInfo = async (bookingId, bankInfo) => {
        try {
            await axios.put(`/api/bookings/${bookingId}/refund-bank-info`, {
                user_id: user.user_id,
                ...bankInfo,
            });
            showMessage('success', 'ส่งข้อมูลบัญชีเรียบร้อย รอแอดมินโอนเงินคืน');
            setBankInfoModal(null);
            fetchHistory();
        } catch (err) {
            showMessage('error', err?.response?.data?.error || 'ไม่สามารถส่งข้อมูลบัญชีได้');
        }
    };

    // แปลงสถานะการจองเป็นขั้นของไทม์ไลน์ + ข้อความ + สี
    // step: -1 = ยกเลิก, 1 = รอแม่บ้าน, 2 = รอชำระเงิน, 3 = ชำระแล้ว/รอรับบริการ, 4 = เสร็จสิ้น/อยู่ระหว่างพิจารณา
    const getTimelineData = (booking) => {
        if (booking.status === 'cancelled' || booking.status === 'cancelled_by_timeout' || booking.status === 'cancelled_by_admin' || booking.status === 'cancelled_no_maid' || booking.status === 'cancelled_no_show' || booking.status === 'refunded') return { step: -1, text: 'ยกเลิกแล้ว', color: 'text-slate-400' };
        if (booking.status === 'completed') return { step: 4, text: 'เสร็จสิ้น', color: 'text-emerald-600', badge: 'bg-emerald-50/80 text-emerald-600 border-emerald-200/60' };
        if (booking.status === 'in_progress') return { step: 3, text: 'กำลังให้บริการ', color: 'text-sky-600', badge: 'bg-sky-50/80 text-sky-600 border-sky-200/60' };
        if (booking.status === 'no_show_reported' || booking.no_show_status === 'reported') return { step: 3, text: 'กำลังตรวจสอบกรณีพนักงานไม่มา', color: 'text-amber-500', badge: 'bg-amber-50/80 text-amber-600 border-amber-200/60' };
        if (booking.status === 'refund_requested') return { step: 4, text: 'อยู่ระหว่างพิจารณาคำขอคืนเงิน', color: 'text-amber-500', badge: 'bg-amber-50/80 text-amber-600 border-amber-200/60' };
        if (booking.status === 'maid_reported') return { step: 4, text: 'กำลังตรวจสอบปัญหาการบริการ', color: 'text-amber-500', badge: 'bg-amber-50/80 text-amber-600 border-amber-200/60' };
        if (booking.status === 'confirmed' || booking.payment_status === 'paid') return { step: 3, text: 'รอรับบริการ', color: 'text-[#006664]', badge: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60 shadow-[0_2px_10px_rgba(16,185,129,0.1)]' };
        if (booking.status === 'verifying_payment' || booking.payment_status === 'waiting_verify') return { step: 3, text: 'รอตรวจสลิป', color: 'text-blue-600', badge: 'bg-blue-50/80 text-blue-600 border-blue-200/60' };
        if (booking.payment_status === 'rejected') return { step: 2, text: 'การชำระเงินถูกปฏิเสธ', color: 'text-red-500', badge: 'bg-red-50/80 text-red-600 border-red-200/60' };
        if (booking.status === 'waiting_payment') return { step: 2, text: 'รอชำระเงิน', color: 'text-rose-500', badge: 'bg-rose-50/80 text-rose-500 border-rose-200/60' };

        // เช็คจากข้อมูลแม่บ้านจริง ไม่ใช่แค่ status string
        const activeMaids = booking.assigned_maids ? booking.assigned_maids.filter((m) => m.maid_status !== 'replaced') : [];
        const hasMaid = activeMaids.length > 0 || !!booking.maid_id;

        if (!hasMaid && (booking.status === 'waiting_maid' || booking.status === 'pending')) {
            return { step: 1, text: 'รอพนักงานกดรับงาน', color: 'text-orange-500', badge: 'bg-orange-50/80 text-orange-600 border-orange-200/60' };
        }
        return { step: 2, text: 'รอชำระเงิน', color: 'text-rose-500', badge: 'bg-rose-50/80 text-rose-500 border-rose-200/60' };
    };

    const toggleNote = (id) => {
        setExpandedNoteId(prev => prev === id ? null : id);
    };

    // แม่บ้านมาสายเกิน 20 นาทีจากเวลานัด (ชำระเงินแล้ว แม่บ้านยังไม่เริ่มงาน และยังไม่เคยแจ้งปัญหา)
    // ใช้เปิดให้ลูกค้ากรอกเลขบัญชีเพื่อรับเงินคืน — เช็คตอน render ซึ่งหน้านี้ดึงข้อมูลใหม่ทุก 60 วินาทีอยู่แล้ว
    const MAID_LATE_MINUTES = 20;
    const isMaidLate = (booking) => {
        if (!booking?.booking_date) return false;
        if (booking.status !== 'confirmed') return false;
        if (booking.job_started_at) return false;
        if (booking.no_show_status && booking.no_show_status !== 'none') return false;
        // เคยส่งเรื่องแล้ว (รอพิจารณา/พิจารณาแล้ว) ไม่ต้องเสนอให้กรอกบัญชีซ้ำ
        if (booking.refund_status && booking.refund_status !== 'none') return false;
        const lateAt = new Date(booking.booking_date).getTime() + MAID_LATE_MINUTES * 60 * 1000;
        return Date.now() >= lateAt;
    };

    // จัดการจองเข้าแท็บกรอง (ทั้งหมด / ยกเลิก / เสร็จสิ้น / กำลังดำเนินการ ฯลฯ) จากขั้นของไทม์ไลน์
    const getFilterCategory = (booking) => {
        const tl = getTimelineData(booking);
        if (tl.step === -1) return 'cancelled';
        if (tl.step === 4) return 'completed';
        if (tl.step === 3) return 'in_progress';
        return 'pending';
    };

    const FILTER_TABS = [
        { key: 'all', label: 'ทั้งหมด' },
        { key: 'pending', label: 'รอดำเนินการ' },
        { key: 'in_progress', label: 'กำลังดำเนินการ' },
        { key: 'completed', label: 'เสร็จสิ้น' },
        { key: 'cancelled', label: 'ยกเลิก' },
    ];

    const filterCounts = FILTER_TABS.reduce((acc, tab) => {
        acc[tab.key] = tab.key === 'all' ? history.length : history.filter(h => getFilterCategory(h) === tab.key).length;
        return acc;
    }, {});

    const filteredHistory = activeFilter === 'all' ? history : history.filter(h => getFilterCategory(h) === activeFilter);

    return (
        <div className="animate-in fade-in duration-300 max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-0 pb-10">

            {statusMsg && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md p-4 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 border shadow-[0_20px_50px_rgba(0,0,0,0.08)] ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : statusMsg.type === 'info' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-[0_20px_50px_rgba(0,102,100,0.12)]' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : statusMsg.type === 'info' ? <HelpCircle size={20} className="shrink-0 text-[#006664]" /> : <AlertCircle size={20} className="shrink-0" />}
                    <span className="font-bold leading-relaxed">{statusMsg.text}</span>
                </div>
            )}

            <div className="mb-8 mt-4 sm:mb-10 sm:mt-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#006664]/5 to-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] shadow-inner border border-[#006664]/10">
                        <ClipboardList size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-normal">
                            ติดตามสถานะงานของคุณ
                        </h2>
                        <div className="h-1.5 w-12 bg-[#006664] rounded-full mt-1.5 opacity-80"></div>
                    </div>
                </div>
            </div>

            {history.length > 0 && (
                <div className="mb-8 border-b border-slate-200 w-full overflow-x-auto overflow-y-hidden scrollbar-hide no-scrollbar scroll-smooth">
                    <div className="flex gap-8 min-w-max px-4">
                        {FILTER_TABS.map((tab) => {
                            const isActive = activeFilter === tab.key;
                            const count = filterCounts[tab.key];
                            
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveFilter(tab.key)}
                                    className={`
                                        group relative flex items-center gap-2 py-4 text-sm font-bold transition-colors duration-200
                                        ${isActive ? 'text-teal-700' : 'text-slate-500 hover:text-teal-700/70'}
                                    `}
                                >
                                    <span>{tab.label}</span>
                                    
                                    {/* Badge ตัวเลข */}
                                    <span className={`
                                        px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-200
                                        ${isActive 
                                            ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20' 
                                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                                    `}>
                                        {count}
                                    </span>
                                    
                                    {/* เส้นใต้ (จะแสดงเฉพาะตอนที่ Tab นั้น Active) */}
                                    {isActive && (
                                        <div className="absolute bottom-[-1px] left-0 right-0 h-[3.5px] bg-teal-600 rounded-t-full shadow-[0_-1px_4px_rgba(13,148,136,0.2)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-6 sm:space-y-8">
                {history.length === 0 ? (
                    <div className="py-20 px-8 text-center text-slate-500 flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        <div className="w-16 h-16 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] mb-6 shadow-inner">
                            <History size={28} />
                        </div>
                        <p className="text-lg font-extrabold text-slate-800 mb-2">คุณยังไม่มีประวัติการจองบริการ</p>
                        <p className="text-[15px] font-medium text-slate-400 mb-8">ให้ทีมงาน มก.ฉกส. เข้าไปดูแลความสะอาดให้คุณสิคะ</p>
                        <button onClick={goToBooking} className="bg-[#006664] hover:bg-[#005553] text-white px-8 py-4 rounded-[1.25rem] font-extrabold text-[15px] flex items-center gap-2.5 transition-all shadow-[0_10px_25px_rgba(0,102,100,0.2)] hover:-translate-y-0.5 active:scale-95">
                            <Home size={18} /> เริ่มจองบริการเลย
                        </button>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="py-16 px-8 text-center flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-5">
                            <ClipboardList size={24} />
                        </div>
                        <p className="text-base font-extrabold text-slate-700 mb-1.5">ไม่มีรายการในสถานะนี้</p>
                        <p className="text-sm font-medium text-slate-400">ลองเลือกดูสถานะอื่น หรือกด "ทั้งหมด" เพื่อดูทุกรายการ</p>
                    </div>
                ) : (
                    filteredHistory.map((h) => (
                        <UserBookingCard
                            key={h.booking_id}
                            h={h}
                            fetchHistory={fetchHistory}
                            setReviewModal={setReviewModal}
                            setRefundModal={setRefundModal}
                            setViewRefundSlip={setViewRefundSlip}
                            expandedNoteId={expandedNoteId}
                            toggleNote={toggleNote}
                            cancelBooking={cancelBooking}
                            goToBooking={goToBooking}
                            getTimelineData={getTimelineData}
                            isMaidLate={isMaidLate}
                            setPayModal={setPayModal}
                            handleViewEvidence={handleViewEvidence}
                            onOpenBankInfoModal={(h) => setBankInfoModal(h)}
                        />
                    ))               )}
            </div>

            {/* ป๊อปอัปต่าง ๆ (แสดงเมื่อ state ของมันมีค่า) */}
            <PaymentModal payModal={payModal} onClose={() => setPayModal(null)} onUpload={handleUploadSlip} />
            <EvidenceModal isOpen={evidenceModalOpen} onClose={() => setEvidenceModalOpen(false)} jobPhotos={jobPhotos} />
            {refundModal && (
                <RefundModal
                    booking={refundModal}
                    mode={refundModal._mode}
                    onClose={() => setRefundModal(null)}
                    onSubmit={submitRefundReport}
                />
            )}
            {viewRefundSlip && <ViewRefundSlipModal slipPath={viewRefundSlip} onClose={() => setViewRefundSlip(null)} />}
            {bankInfoModal && (
                <RefundModal
                    booking={bankInfoModal}
                    mode="bank_info"
                    onClose={() => setBankInfoModal(null)}
                    onSubmit={handleSubmitBankInfo}
                />
            )}

            <ReviewModal
                isOpen={!!reviewModal}
                booking={reviewModal}
                onClose={() => setReviewModal(null)}
                onSubmit={submitReview}
            />
        </div>
    );
};

export default UserHistoryTab;