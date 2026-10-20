import React from "react";
import { Check, AlertCircle } from "lucide-react";

const BookingTimeline = ({
    h,
    timeline,
    isCancelled,
    isNoShowReported,
}) => {
    // เคสลูกค้าขอคืนเงินหลังงานเสร็จแล้ว (ต่างจากแม่บ้านแจ้งปัญหา/แจ้งพนักงานไม่มาตามนัด ที่งานไม่เคยเสร็จจริง)
    // งานเกิดขึ้นจริงและเสร็จสมบูรณ์แล้ว แม้ระบบจะปรับสถานะการจองเป็น "cancelled" หลังคืนเงิน ก็ยังอยากโชว์ขั้นตอนงานแบบเสร็จสิ้นต่อไป
    const isCompletedRefund = h.reason_type === 'refund_request';

    // ซ่อน Timeline ทั้งหมดหากถูกยกเลิกจริง (ไม่ใช่กรณีคืนเงินหลังงานเสร็จ) หรืออยู่ระหว่างพิจารณาข้อพิพาท
    if ((isCancelled && !isCompletedRefund) || isNoShowReported) {
        return null;
    }

    const stepLabels = ["รอรับงาน", "ชำระเงิน", "", "เสร็จสิ้น"];
    const effectiveStep = isCompletedRefund ? 4 : timeline.step;

    const stepStatusLabel =
        effectiveStep > 3 || h.status === "in_progress"
            ? "เข้าบริการแล้ว"
            : h.payment_status === "paid" || h.status === "confirmed"
              ? "รอรับบริการ"
              : h.status === "verifying_payment" ||
                  h.payment_status === "waiting_verify"
                ? "รอตรวจสลิป"
                : h.payment_status === "rejected"
                  ? "สลิปไม่ผ่าน"
                  : "รอชำระเงิน";

    const displayStep = effectiveStep;

    return (
        <>
            {/* ไทม์ไลน์ (จอใหญ่) */}
            <div className="relative mt-auto pt-6 border-t border-slate-100/40 hidden sm:block px-4">
                <div className="absolute left-8 right-8 top-10 h-[2px] bg-slate-100 rounded-full"></div>
                <div
                    className="absolute left-8 top-10 h-[2px] bg-[#006664] rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `calc(${(displayStep - 1) * 33.33}% - 16px)` }}
                ></div>

                <div className="flex justify-between relative z-10">
                    <div className="flex flex-col items-center gap-2.5 w-16">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${displayStep >= 1 ? "border-[#006664] text-[#006664]" : "border-slate-200 text-slate-300"}`}
                        >
                            <Check size={14} strokeWidth={3} className={displayStep > 1 ? "opacity-100" : "opacity-0"} />
                            {displayStep === 1 && <div className="absolute w-2 h-2 bg-[#006664] rounded-full"></div>}
                        </div>
                        <span className={`text-[11px] font-extrabold whitespace-nowrap ${displayStep >= 1 ? "text-slate-700" : "text-slate-400"}`}>{stepLabels[0]}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5 w-16">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${displayStep >= 2 ? "border-[#006664] text-[#006664]" : "border-slate-200 text-slate-300"}`}
                        >
                            <Check size={14} strokeWidth={3} className={displayStep > 2 ? "opacity-100" : "opacity-0"} />
                            {displayStep === 2 && <div className="absolute w-2 h-2 bg-[#006664] rounded-full"></div>}
                        </div>
                        <span className={`text-[11px] font-extrabold whitespace-nowrap ${displayStep >= 2 ? "text-slate-700" : "text-slate-400"}`}>{stepLabels[1]}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5 w-16">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${displayStep >= 3 ? "border-[#006664] text-[#006664]" : displayStep === 2 ? (h.payment_status === "rejected" ? "border-red-400 text-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-rose-400 text-rose-500 shadow-[0_0_0_4px_rgba(2fb344,0.1)]") : "border-slate-200 text-slate-300"}`}
                        >
                            {h.payment_status === "rejected" ? (
                                <AlertCircle size={14} strokeWidth={3} />
                            ) : (
                                <Check size={14} strokeWidth={3} className={displayStep > 3 ? "opacity-100" : "opacity-0"} />
                            )}
                            {displayStep === 3 && <div className="absolute w-2.5 h-2.5 bg-[#006664] rounded-full shadow-[0_0_8px_rgba(0,102,100,0.3)]"></div>}
                        </div>
                        <span className={`text-[11px] font-extrabold whitespace-nowrap ${displayStep >= 3 ? (displayStep === 3 && h.payment_status === "paid" ? "text-emerald-600" : "text-slate-700") : displayStep === 2 ? (h.payment_status === "rejected" ? "text-red-500" : "text-rose-500") : "text-slate-400"}`}>
                            {stepStatusLabel}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-2.5 w-16">
                        <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white ${displayStep >= 4 ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-slate-300"}`}
                        >
                            <Check size={14} strokeWidth={3} className={displayStep >= 4 ? "opacity-100" : "opacity-0"} />
                        </div>
                        <span className={`text-[11px] font-extrabold whitespace-nowrap ${displayStep >= 4 ? "text-emerald-600" : "text-slate-400"}`}>{stepLabels[3]}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Timeline (อยู่ในส่วนรายละเอียดที่พับได้ของการ์ด จึงแสดงเต็มเสมอ ไม่ต้องมีปุ่มพับซ้ำ) */}
            <div className="sm:hidden mt-2">
                <div>
                    <div>
                        <div className="relative pt-2 pb-2 border-l-2 border-slate-100 ml-[15px] px-4 space-y-6">
                            <div className="relative">
                                <div
                                    className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${displayStep >= 1 ? "border-[#006664] text-[#006664]" : "border-slate-200 text-slate-300"}`}
                                >
                                    <Check strokeWidth={3} className={`w-3 h-3 ${displayStep > 1 ? "opacity-100" : "opacity-0"}`} />
                                    {displayStep === 1 && <div className="absolute w-2 h-2 bg-[#006664] rounded-full"></div>}
                                </div>
                                <span className={`text-[13px] font-bold block -mt-0.5 ${displayStep >= 1 ? "text-slate-800" : "text-slate-400"}`}>{stepLabels[0]}</span>
                            </div>

                            <div className="relative">
                                <div
                                    className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${displayStep >= 2 ? "border-[#006664] text-[#006664]" : "border-slate-200 text-slate-300"}`}
                                >
                                    <Check strokeWidth={3} className={`w-3 h-3 ${displayStep > 2 ? "opacity-100" : "opacity-0"}`} />
                                    {displayStep === 2 && <div className="absolute w-2 h-2 bg-[#006664] rounded-full"></div>}
                                </div>
                                <span className={`text-[13px] font-bold block -mt-0.5 ${displayStep >= 2 ? "text-slate-800" : "text-slate-400"}`}>{stepLabels[1]}</span>
                            </div>

                            <div className="relative">
                                <div
                                    className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${displayStep >= 3 ? "border-[#006664] text-[#006664]" : displayStep === 2 ? (h.payment_status === "rejected" ? "border-red-400 text-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-rose-400 text-rose-500 shadow-[0_0_0_4px_rgba(2fb344,0.1)]") : "border-slate-200 text-slate-300"}`}
                                >
                                    {h.payment_status === "rejected" ? (
                                        <AlertCircle size={10} strokeWidth={3} />
                                    ) : (
                                        <Check strokeWidth={3} className={`w-3 h-3 ${displayStep > 3 ? "opacity-100" : "opacity-0"}`} />
                                    )}
                                    {displayStep === 3 && <div className="absolute w-2 h-2 bg-[#006664] rounded-full shadow-[0_0_6px_rgba(0,102,100,0.3)]"></div>}
                                </div>
                                <span className={`text-[13px] font-bold block -mt-0.5 ${displayStep >= 3 ? (displayStep === 3 && (h.payment_status === "paid" || h.status === "confirmed") ? "text-emerald-600" : "text-slate-800") : displayStep === 2 ? (h.payment_status === "rejected" ? "text-red-500" : "text-rose-500") : "text-slate-400"}`}>
                                    {stepStatusLabel}
                                </span>
                            </div>

                            <div className="relative">
                                <div
                                    className={`absolute -left-[25px] top-0 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white ${displayStep >= 4 ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-slate-300"}`}
                                >
                                    <Check strokeWidth={3} className={`w-3 h-3 ${displayStep >= 4 ? "opacity-100" : "opacity-0"}`} />
                                </div>
                                <span className={`text-[13px] font-bold block -mt-0.5 ${displayStep >= 4 ? "text-emerald-600" : "text-slate-400"}`}>{stepLabels[3]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingTimeline;
