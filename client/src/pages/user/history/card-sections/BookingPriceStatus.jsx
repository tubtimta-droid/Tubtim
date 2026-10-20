import React from "react";
import { Check, AlertCircle, Clock, CreditCard, XCircle, CheckCircle, AlertTriangle } from "lucide-react";

const BookingPriceStatus = ({
    h,
    timeline,
    isPriceSet,
    isCancelled,
    isCancelledNoMaid,
    isAllMaidsAccepted,
    isNoShowReported,
    isMaidLate,
}) => {
    return (
        <div className="mb-6">
            {(() => {
                const allAccepted = isAllMaidsAccepted;

                if (isPriceSet) {
                    return (
                        <>
                            {/* การ์ดราคา */}
                            <div
                                className={`relative overflow-hidden rounded-2xl p-5 ${isCancelled ? "bg-slate-50 border border-slate-100" : "bg-gradient-to-br from-[#006664]/[0.04] to-[#006664]/[0.08] border border-[#006664]/10"}`}
                            >
                                <p className={`text-[11px] font-bold uppercase tracking-[0.15em] mb-3 ${isCancelled ? "text-slate-500" : "text-[#006664]/60"}`}>
                                    ยอดชำระค่าบริการ
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold ${isCancelled ? "text-slate-400" : "text-[#006664]/40"}`}>฿</span>
                                    <span className={`text-4xl font-extrabold tracking-normal leading-none ${isCancelled ? "text-slate-500" : "text-[#006664]"}`}>
                                        {Number(h.total_price).toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>

                            {/* ข้อความแจ้งสถานะ */}
                            {isMaidLate && (
                                <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertTriangle size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-amber-700 leading-snug">
                                            แม่บ้านยังไม่มาตามนัด
                                        </p>
                                        <p className="text-[12px] text-amber-600/70 font-medium mt-1 leading-relaxed">
                                            เลยเวลานัดมากกว่า 20 นาทีแล้ว กรุณากรอกเลขบัญชีเพื่อรับเงินคืน
                                        </p>
                                    </div>
                                </div>
                            )}
                            {h.refund_status === "rejected" && (
                                <div className="mt-4 flex items-start gap-3 bg-rose-50/70 border border-rose-100 p-4 rounded-2xl">
                                    <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                        <XCircle size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-rose-700 leading-snug">
                                            {(h.reason_type || "").startsWith("maid_") ? "ตรวจสอบเรื่องที่ผู้ให้บริการแจ้งแล้ว" : "ไม่อนุมัติคำขอคืนเงิน"}
                                        </p>
                                        <p className="text-[12px] text-rose-600/80 font-medium mt-1 leading-relaxed break-words">
                                            {h.refund_admin_note
                                                ? `เหตุผลจากแอดมิน: ${h.refund_admin_note}`
                                                : (h.reason_type || "").startsWith("maid_")
                                                    ? "แอดมินตรวจสอบแล้ว ไม่มีการคืนเงิน และงานนี้ดำเนินการตามเดิม"
                                                    : "แอดมินตรวจสอบแล้วพบว่าเหตุผลที่แจ้งไม่สอดคล้องกับข้อเท็จจริง จึงไม่สามารถคืนเงินได้"}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {h.payment_status === "paid" && !isCancelled && !isNoShowReported && !isMaidLate && h.refund_status !== "rejected" && (
                                <div className="mt-4 flex items-start gap-3 bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl">
                                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Check size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-emerald-700 leading-snug">
                                            {h.status === "completed" ? "ให้บริการเรียบร้อยแล้ว" : "ชำระเงินเรียบร้อย"}
                                        </p>
                                        <p className="text-[12px] text-emerald-600/70 font-medium mt-1 leading-relaxed">
                                            {h.status === "completed" ? "ขอบคุณที่ใช้บริการ KUCSC Clean" : "เตรียมรับบริการตามเวลานัดหมาย"}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {isNoShowReported && (
                                <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertCircle size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-amber-700 leading-snug">
                                            {h.status === "maid_reported" ? "มีการแจ้งปัญหาหน้างานจากผู้ให้บริการ" : "รับเรื่องร้องเรียนแล้ว"}
                                        </p>
                                        <p className="text-[12px] text-amber-600/70 font-medium mt-1 leading-relaxed">
                                            {h.status === "maid_reported" ? "แอดมินกำลังตรวจสอบเรื่องที่ผู้ให้บริการแจ้งเข้ามา" : "แอดมินกำลังตรวจสอบและพิจารณาคำขอคืนเงิน"}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {h.payment_status === "unpaid" && !isCancelled && (
                                <div className="mt-4">
                                    {timeline.step === 1 ? (
                                        <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                                            <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                                <Clock size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-amber-700 leading-snug">รอพนักงานรับงาน</p>
                                                <p className="text-[12px] text-amber-600/70 font-medium mt-1 leading-relaxed">คุณจะชำระเงินได้หลังจากมีพนักงานรับงานแล้ว</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3 bg-teal-50/80 border border-teal-100 p-4 rounded-2xl">
                                            <div className="w-9 h-9 bg-[#006664] text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-[#006664]/20">
                                                <CreditCard size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-[#006664] leading-snug">พนักงานรับงานแล้ว</p>
                                                <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">กรุณาชำระเงินเพื่อยืนยันคิวงาน</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {h.payment_status === "waiting_verify" && !isCancelled && (
                                <div className="mt-4 flex items-start gap-3 bg-blue-50/80 border border-blue-100 p-4 rounded-2xl">
                                    <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-blue-700 leading-snug">ส่งหลักฐานแล้ว</p>
                                        <p className="text-[12px] text-blue-600/70 font-medium mt-1 leading-relaxed">รอการตรวจสอบสลิปของคุณ</p>
                                    </div>
                                </div>
                            )}
                        </>
                    );
                }

                if (isCancelled) {
                    return null;
                }

                if (!allAccepted) {
                    return (
                        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#006664]/[0.04] to-[#006664]/[0.08] border border-[#006664]/10">
                            <p className="text-[11px] font-bold text-[#006664]/60 uppercase tracking-[0.15em] mb-3">ยอดชำระค่าบริการ</p>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold text-[#006664]/40">฿</span>
                                <span className="text-4xl font-extrabold tracking-normal leading-none text-[#006664]">
                                    {Number(h.total_price).toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                                </span>
                            </div>
                            <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-100 p-3 rounded-xl">
                                <Clock size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[12px] text-amber-700 font-medium leading-relaxed">คุณจะชำระเงินได้หลังจากมีพนักงานรับงานแล้ว</p>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#006664]/[0.04] to-[#006664]/[0.08] border border-[#006664]/10">
                        <p className="text-[11px] font-bold text-[#006664]/60 uppercase tracking-[0.15em] mb-3">ยอดชำระค่าบริการ</p>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-bold text-[#006664]/40">฿</span>
                            <span className="text-4xl font-extrabold tracking-normal leading-none text-[#006664]">
                                {Number(h.total_price).toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 bg-teal-50/80 border border-teal-100 p-3 rounded-xl">
                            <CreditCard size={14} className="text-[#006664] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[13px] font-bold text-[#006664] leading-snug">พนักงานรับงานแล้ว</p>
                                <p className="text-[12px] text-slate-500 font-medium mt-0.5">กรุณาชำระเงินเพื่อยืนยันคิวงาน</p>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {isPriceSet && h.payment_status === "rejected" && !isCancelled && (
                <div className="mt-4 flex items-start gap-3 bg-red-50/80 border border-red-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-red-700 leading-snug">การชำระเงินถูกปฏิเสธ</p>
                        <p className="text-[12px] text-red-600/70 font-medium mt-1 leading-relaxed">
                            {h.admin_note || "กรุณาอัปโหลดสลิปใหม่อีกครั้ง"}
                        </p>
                    </div>
                </div>
            )}

            {isCancelledNoMaid && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-amber-800 leading-snug">ขออภัย</p>
                        <p className="text-[12px] text-amber-700/80 font-medium mt-1 leading-relaxed">
                            ไม่พบพนักงานว่างรับงานก่อนเวลานัดหมาย ระบบจึงยกเลิกอัตโนมัติ กรุณาจองใหม่อีกครั้ง
                        </p>
                    </div>
                </div>
            )}
            {h.status === "cancelled_by_timeout" && (
                <div className="mt-4 flex items-start gap-3 bg-red-50/80 border border-red-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-red-700 leading-snug">ยกเลิกอัตโนมัติ</p>
                        <p className="text-[12px] text-red-600/70 font-medium mt-1 leading-relaxed">
                            หมดเวลาชำระเงิน หรือหมดเวลาก่อนเริ่มงาน ระบบจึงยกเลิกอัตโนมัติ กรุณาจองใหม่อีกครั้ง
                        </p>
                    </div>
                </div>
            )}
            {h.refund_status === "refunded" && (!h.customer_refund_status || Number(h.refund_amount) <= 0 || h.customer_refund_status === "paid") && (
                <div className="mt-4 flex items-start gap-3 bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle size={16} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-emerald-700 leading-snug">คืนเงินเรียบร้อยแล้ว</p>
                        <p className="text-[12px] text-emerald-600/70 font-medium mt-1 leading-relaxed">
                            แอดมินได้พิจารณาคำขอคืนเงินและโอนเงิน{h.refund_amount != null ? ` ฿${Number(h.refund_amount).toLocaleString("th-TH")}` : ""} คืนให้คุณเรียบร้อยแล้ว
                        </p>
                    </div>
                </div>
            )}
            {h.refund_status === "refunded" && h.customer_refund_status === "ready" && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-amber-700 leading-snug">กำลังดำเนินการโอนเงินคืน</p>
                        <p className="text-[12px] text-amber-600/70 font-medium mt-1 leading-relaxed">
                            แอดมินได้รับข้อมูลบัญชีของคุณแล้ว กำลังดำเนินการโอนเงิน{h.refund_amount != null ? ` ฿${Number(h.refund_amount).toLocaleString("th-TH")}` : ""} คืนให้คุณ
                        </p>
                    </div>
                </div>
            )}
            {h.refund_status === "refunded" && h.customer_refund_status === "waiting_bank_info" && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50/80 border border-amber-100 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-amber-700 leading-snug">คืนเงินค่าบริการ</p>
                        <p className="text-[12px] text-amber-600/70 font-medium mt-1 leading-relaxed">
                            มีการรายงานปัญหาหน้างานจากผู้ให้บริการ กรุณากรอกบัญชีธนาคารเพื่อรับเงินคืน{h.refund_amount != null ? ` ฿${Number(h.refund_amount).toLocaleString("th-TH")}` : ""}
                        </p>
                    </div>
                </div>
            )}

            {isCancelled && !isCancelledNoMaid && h.status !== "cancelled_by_timeout" && h.refund_status !== "refunded" && (
                <div className="mt-4 flex items-start gap-3 bg-slate-50/80 border border-slate-200 p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-[#f8fafc] text-slate-400 border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                        <XCircle size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 leading-snug">
                            {h.cancel_reason === "ผู้ใช้ขอยกเลิกเอง" || h.cancel_reason === "ยกเลิกโดยผู้ใช้" || h.cancel_reason === "ยกเลิกโดยผู้ใช้"
                                ? "ยกเลิกบริการสำเร็จ"
                                : "ถูกยกเลิก"}
                        </p>
                        <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">
                            {h.cancel_reason === "ผู้ใช้ขอยกเลิกเอง" || h.cancel_reason === "ยกเลิกโดยผู้ใช้" || h.admin_note === "ยกเลิกโดยผู้ใช้"
                                ? "คุณได้ทำรายการยกเลิกคำขอรับบริการนี้เรียบร้อยแล้ว"
                                : (h.cancel_reason || "รายการจองนี้ถูกยกเลิกเรียบร้อยแล้ว")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPriceStatus;
