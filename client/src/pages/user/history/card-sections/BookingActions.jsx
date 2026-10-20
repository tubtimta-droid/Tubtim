import React from "react";
import { Wallet, QrCode, Star, Camera, Landmark } from "lucide-react";

// ขอคืนเงินหลังงานเสร็จได้ภายใน 24 ชั่วโมงนับจากที่แม่บ้านกดเสร็จงาน (completed_at) เกินแล้วปุ่มหาย
// ถ้าไม่มี completed_at (ข้อมูลเก่า) ไม่มีเวลาให้เทียบ จึงยังแสดงปุ่มไว้ ไม่ตัดสิทธิ์ลูกค้าโดยไม่มีหลักฐาน
const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;
const isWithinRefundWindow = (h) => {
    if (!h.completed_at) return true;
    return Date.now() - new Date(h.completed_at).getTime() <= REFUND_WINDOW_MS;
};

const BookingActions = ({
    h,
    isEligibleForRefund,
    setRefundModal,
    isCancelled,
    isPriceSet,
    isDeadlinePassed,
    setPayModal,
    setReviewModal,
    handleViewEvidence,
    cancelBooking,
    isMaidLate,
    isCancelledNoMaid,
    goToBooking,
    onOpenBankInfoModal,
}) => {
    return (
        <div className="space-y-2.5 mt-auto w-full">
            {h.refund_status === "refunded" && h.customer_refund_status === "waiting_bank_info" && onOpenBankInfoModal && (
                <button
                    onClick={() => onOpenBankInfoModal(h)}
                    className="w-full py-4 bg-[#006664] text-white rounded-[1.25rem] font-extrabold text-[14px] hover:bg-[#005553] transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,102,100,0.2)] active:scale-[0.98]"
                >
                    <Landmark size={18} /> กรอกบัญชีธนาคาร
                </button>
            )}

            {isEligibleForRefund && (
                <button
                    onClick={() => setRefundModal(h)}
                    className="w-full py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-[1.25rem] font-extrabold text-[14px] hover:bg-rose-100/70 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Wallet size={18} /> แจ้งรับเงินคืน
                </button>
            )}

            {!isCancelled &&
                isPriceSet &&
                h.status !== "waiting_maid" &&
                !["paid", "waiting_verify"].includes(h.payment_status) &&
                (!isDeadlinePassed || h.payment_status === "rejected") && (
                    <button
                        onClick={() => setPayModal(h)}
                        className="w-full py-4 rounded-[1.25rem] font-extrabold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-[#006664] text-white hover:bg-[#005553] shadow-[0_10px_25px_rgba(0,102,100,0.2)]"
                    >
                        <QrCode size={18} /> ชำระเงิน / แนบสลิป
                    </button>
                )}

            {h.status === "completed" && (
                <>
                    <div className="flex flex-col gap-2 mb-2">
                        {!h.my_rating &&
                            h.assigned_maids?.some(
                                (m) =>
                                    m.maid_status === "accepted" ||
                                    m.maid_status === "replaced",
                            ) && (
                                <button
                                    onClick={() => setReviewModal(h)}
                                    className="w-full py-3.5 bg-amber-500 text-white rounded-[1.25rem] font-extrabold text-[14px] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-[0_8px_20_rgba(245,158,11,0.2)] active:scale-[0.98]"
                                >
                                    <Star size={16} className="fill-white" />{" "}
                                    ให้คะแนนพึงพอใจ
                                </button>
                            )}
                    </div>
                    {isWithinRefundWindow(h) &&
                        (!h.refund_status || h.refund_status === "none") && (
                            <button
                                onClick={() =>
                                    setRefundModal({
                                        ...h,
                                        _mode: "refund",
                                    })
                                }
                                className="w-full py-3.5 mt-2 bg-white text-slate-500 border border-slate-200 rounded-[1.25rem] font-bold text-[13px] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                            >
                                <Wallet size={16} /> ขอคืนเงิน
                            </button>
                        )}
                </>
            )}

            {(['completed', 'refund_requested', 'refunded', 'rejected'].includes(h.status) || (h.status === 'cancelled' && h.reason_type === 'refund_request') || h.completed_at) && (
                <button
                    onClick={() => {
                        if (handleViewEvidence) handleViewEvidence(h.booking_id);
                    }}
                    className="w-full py-3.5 mt-2 bg-white text-slate-500 border border-slate-100 rounded-[1.25rem] font-bold text-[13px] hover:border-[#006664]/30 hover:text-[#006664] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                >
                    <Camera size={16} /> ดูรูปภาพผลงาน (Before/After)
                </button>
            )}

            {h.status === "waiting_maid" &&
                !isCancelled &&
                (!h.refund_status || h.refund_status === "none") && (
                    <button
                        onClick={() => cancelBooking(h.booking_id)}
                        className="w-full py-3.5 mt-2 bg-slate-50 text-slate-400 border border-transparent hover:border-red-100 hover:bg-red-50 hover:text-red-500 rounded-[1.25rem] text-[13px] font-bold transition-all active:scale-[0.98]"
                    >
                        ยกเลิกคำขอ
                    </button>
                )}

            {isMaidLate && (
                <button
                    onClick={() => setRefundModal({ ...h, _mode: "no_show" })}
                    className="w-full py-3.5 mt-2 bg-[#006664] text-white rounded-[1.25rem] text-[13px] font-bold hover:bg-[#005553] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-[0_10px_25px_rgba(0,102,100,0.2)]"
                >
                    <Landmark size={15} /> กรอกเลขบัญชีรับเงินคืน
                </button>
            )}

            {isCancelledNoMaid && (
                <button
                    onClick={goToBooking}
                    className="w-full py-3.5 mt-2 bg-[#006664] text-white rounded-[1.25rem] text-[13px] font-bold hover:bg-[#005553] transition-all active:scale-[0.98] shadow-[0_10px_25px_rgba(0,102,100,0.2)]"
                >
                    จองใหม่อีกครั้ง
                </button>
            )}
        </div>
    );
};

export default BookingActions;
