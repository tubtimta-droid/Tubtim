import React, { useState } from 'react';
import { X, AlertTriangle, Check, Info, ChevronDown, ChevronLeft } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

// เหตุผลสำเร็จรูปให้แอดมินเลือกตอนปฏิเสธสลิป
const REJECTION_REASONS = [
    "ยอดเงินไม่ตรงกับระบบ",
    "ภาพสลิปเบลออ่านรายละเอียดไม่ได้",
    "ชื่อบัญชีปลายทางไม่ถูกต้อง",
    "วันเวลาการโอนไม่สอดคล้อง",
    "สลิปซ้ำเคยถูกใช้งานแล้ว",
    "อื่นๆ (โปรดระบุ)"
];

const VerifySlipModal = ({ booking, onClose, onApprove, onReject }) => {
    useLockBodyScroll();
    // confirmMode: null = ดูสลิป, 'approve' / 'reject' = หน้ายืนยัน · rejectReason/rejectNote = เหตุผลที่เลือก/พิมพ์เอง
    const [confirmMode, setConfirmMode] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectNote, setRejectNote] = useState('');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

    // ดูอย่างเดียว (ไม่มีปุ่มอนุมัติ/ปฏิเสธ) ถ้าการจองยกเลิกแล้ว หรือสลิปถูกตรวจไปแล้ว
    const isViewOnly = booking?.status === 'cancelled' || booking?.payment_status === 'paid' || booking?.payment_status === 'rejected';

    const handleRejectSubmit = () => {
        // ถ้าระบุอื่นๆ ให้ใช้ข้อความที่พิมพ์เป็นเหตุผลหลักส่งไปหลังบ้าน
        const finalReason = rejectReason === 'อื่นๆ (โปรดระบุ)' ? rejectNote : rejectReason;
        onReject(booking?.id, finalReason);
    };

    const handleApproveSubmit = () => {
        onApprove(booking?.id);
    };

    // เช็คว่าปุ่มยืนยันปฏิเสธควรถูก Disable หรือไม่
    const isRejectDisabled = !rejectReason || (rejectReason === "อื่นๆ (โปรดระบุ)" && !rejectNote.trim());

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity"
            onClick={onClose}
        >
            {/* Modal Container - ใช้ Wrapper ตัวเดียวเพื่อให้ขนาดเท่ากันและไม่กระตุกเวลาเปลี่ยนหน้า */}
            <div
                className="bg-white rounded-[24px] shadow-2xl w-full max-w-[540px] z-50 overflow-hidden transform transition-all flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* ========================================================= */}
                {/* 🛑 โหมดปฏิเสธสลิป */}
                {/* ========================================================= */}
                {confirmMode === 'reject' && (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-200">
                        {/* ส่วนหัว */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setConfirmMode(null)}
                                    className="p-1.5 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-90"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <h2 className="text-xl font-semibold text-slate-800">ตรวจสอบสลิป</h2>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        {/* เนื้อหา */}
                        <div className="p-6 space-y-6">
                            {/* กล่องคำเตือน */}
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                                <div className="text-rose-500 mt-0.5 shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-rose-800 mb-1">ปฏิเสธสลิปโอนเงิน</h3>
                                    <p className="text-sm text-rose-600/90 leading-relaxed">
                                        การดำเนินการนี้จะแจ้งเตือนให้ผู้ใช้งานทราบ และร้องขอให้อัปโหลดหลักฐานการโอนเงินใหม่
                                    </p>
                                </div>
                            </div>

                            {/* ช่องเลือก/กรอกเหตุผล */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        ระบุเหตุผลการปฏิเสธ <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={rejectReason}
                                            onChange={(e) => {
                                                setRejectReason(e.target.value);
                                                if (e.target.value !== "อื่นๆ (โปรดระบุ)") setRejectNote("");
                                            }}
                                            className="w-full appearance-none bg-white border border-slate-300 text-slate-700 rounded-xl px-4 py-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors cursor-pointer"
                                        >
                                            <option value="" disabled>เลือกเหตุผลการปฏิเสธ...</option>
                                            {REJECTION_REASONS.map((r, i) => (
                                                <option key={i} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* ช่องกรอกเพิ่มเติมเมื่อเลือก "อื่นๆ" */}
                                {rejectReason === "อื่นๆ (โปรดระบุ)" && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <textarea
                                            placeholder="โปรดระบุเหตุผลที่ปฏิเสธสลิปนี้ให้ผู้ใช้ทราบ..."
                                            value={rejectNote}
                                            onChange={(e) => setRejectNote(e.target.value)}
                                            className="w-full appearance-none bg-white border border-slate-300 text-slate-700 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors resize-none"
                                            rows={3}
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ส่วนท้าย (ปุ่ม) */}
                        <div className="px-6 pb-6 flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmMode(null)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all active:scale-[0.98]"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={isRejectDisabled}
                                className={`px-6 py-3 rounded-xl font-medium transition-all ${!isRejectDisabled
                                        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-[0.98]'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                ยืนยันปฏิเสธ
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* ✅ โหมดหน้าต่างยืนยันการอนุมัติ */}
                {/* ========================================================= */}
                {confirmMode === 'approve' && (
                    <div className="animate-in slide-in-from-left-4 fade-in duration-200 relative">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 pt-12 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-20"></div>
                                <div className="w-14 h-14 bg-teal-100 text-[#0F766E] rounded-full flex items-center justify-center">
                                    <Check size={32} strokeWidth={2.5} />
                                </div>
                            </div>

                            <h2 className="text-2xl font-semibold text-slate-800 mb-3">ยืนยันการอนุมัติยอดเงิน</h2>
                            <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
                                คุณได้ตรวจสอบความถูกต้องของสลิป<br />และยอดเงินโอนเข้าเรียบร้อยแล้วใช่หรือไม่?
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmMode(null)}
                                    className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all active:scale-[0.98]"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleApproveSubmit}
                                    className="flex-1 px-4 py-3.5 bg-[#0F766E] text-white rounded-xl font-medium hover:bg-[#0D635D] shadow-sm shadow-teal-700/20 transition-all active:scale-[0.98]"
                                >
                                    ยืนยันอนุมัติ
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 📄 โหมดดูสลิปปกติ (Main View) */}
                {/* ========================================================= */}
                {confirmMode === null && (
                    <div className="animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* ส่วนหัว */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {isViewOnly ? 'หลักฐานการโอนเงิน (สลิป)' : 'ตรวจสอบสลิป'}
                            </h2>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                                <X size={20} />
                            </button>
                        </div>

                        {/* เนื้อหา */}
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            {isViewOnly && (
                                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                                    <div className="text-slate-400 mt-0.5">
                                        <Info size={20} />
                                    </div>
                                    <div>
                                        {booking?.status === 'cancelled' ? (
                                            <>
                                                <h3 className="font-medium text-slate-700 mb-1">รายการนี้ถูกยกเลิกแล้ว</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed">โหมดดูสลิปเพื่อเป็นข้อมูลในการโอนเงินคืนลูกค้า</p>
                                            </>
                                        ) : booking?.payment_status === 'rejected' ? (
                                            <>
                                                <h3 className="font-medium text-slate-700 mb-1">สลิปนี้ถูกปฏิเสธแล้ว</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed">ระบบได้แจ้งให้ลูกค้าอัปโหลดสลิปใหม่แล้ว</p>
                                            </>
                                        ) : (
                                            <h3 className="font-medium text-slate-700">รายการนี้ตรวจสอบและอนุมัติยอดเงินแล้ว</h3>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ส่วนแสดงรูปสลิป */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
                                <img
                                    src={booking?.payment_slip ? `/backend-images${booking.payment_slip}` : 'https://placehold.co/400x600/f8fafc/94a3b8?text=No+Slip+Image'}
                                    className="w-full h-auto max-h-[50vh] object-contain rounded-xl cursor-zoom-in"
                                    alt="Payment Slip"
                                    onClick={() => setIsFullscreenOpen(true)}
                                    onError={(e) => {
                                        e.target.src = 'https://placehold.co/400x600/f8fafc/94a3b8?text=Image+Not+Found';
                                    }}
                                />
                            </div>
                        </div>

                        {/* ส่วนท้าย (ปุ่ม) */}
                        <div className="px-6 pb-6 pt-2 shrink-0">
                            {!isViewOnly ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmMode('reject')}
                                        className="flex-1 px-4 py-3.5 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-all active:scale-[0.98]"
                                    >
                                        ปฏิเสธการชำระเงิน
                                    </button>
                                    <button
                                        onClick={() => setConfirmMode('approve')}
                                        className="flex-1 px-4 py-3.5 bg-[#0F766E] text-white rounded-xl font-medium hover:bg-[#0D635D] shadow-sm shadow-teal-700/20 transition-all active:scale-[0.98]"
                                    >
                                        อนุมัติยอดเงิน
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all active:scale-[0.98]"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isFullscreenOpen && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsFullscreenOpen(false)}
                >
                    <button
                        onClick={() => setIsFullscreenOpen(false)}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        aria-label="Close fullscreen"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={booking?.payment_slip ? `/backend-images${booking.payment_slip}` : 'https://placehold.co/400x600/0f172a/94a3b8?text=No+Slip+Image'}
                        className="max-w-[96vw] max-h-[92vh] w-auto h-auto object-contain rounded-md"
                        alt="Payment Slip Fullscreen"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/400x600/0f172a/94a3b8?text=Image+Not+Found';
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default VerifySlipModal;