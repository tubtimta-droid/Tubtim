import React, { useState } from "react";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { formatDateTime } from "../../../utils/helpers";

// ส่วนย่อยของการ์ด
import BookingHeader from "./card-sections/BookingHeader";
import BookingServices from "./card-sections/BookingServices";
import BookingMaidInfo from "./card-sections/BookingMaidInfo";
import BookingTimeline from "./card-sections/BookingTimeline";

import BookingPriceStatus from "./card-sections/BookingPriceStatus";
import BookingActions from "./card-sections/BookingActions";

// ชื่อบริการภาษาไทย (แยกออกมาจาก UserHistoryTab)
const SERVICE_RULES = {
    bedroom: { label: "ทำความสะอาดห้องนอน" },
    bathroom: { label: "ขัดล้างห้องน้ำ" },
    balcony: { label: "ทำความสะอาดระเบียง" },
    kitchen: { label: "ทำความสะอาดโซนครัว" },
    fridge: { label: "ล้างทำความสะอาดตู้เย็น" },
    laundry: { label: "ซักผ้า-ตากผ้า" },
    ironing: { label: "รีดผ้า" },
};

const UserBookingCard = ({
    h,
    fetchHistory,
    setReviewModal,
    setRefundModal,
    setViewRefundSlip,
    expandedNoteId,
    toggleNote,
    cancelBooking,
    goToBooking,
    getTimelineData,
    isMaidLate,
    setPayModal,
    handleViewEvidence,
    onOpenBankInfoModal,
}) => {
    // --- ค่าที่คำนวณจากข้อมูลการจอง (h) ใช้ตัดสินว่าจะแสดงอะไร ---
    const { date, time } = formatDateTime(h.booking_date);
    const isPriceSet = Number(h.total_price) > 0;
    const timeline = getTimelineData(h);
    const isCancelled = timeline.step === -1;
    const isNoShowReported = h.status === 'no_show_reported' || h.no_show_status === 'reported' || h.status === 'refund_requested' || h.status === 'maid_reported';
    const isCancelledNoMaid = h.status === "cancelled_no_maid";
    const maidLate = isMaidLate(h);

    // เลยกำหนดชำระเงินแล้วหรือยัง และควรแสดงตัวนับถอยหลังไหม (เฉพาะตอนรอชำระ/สลิปถูกปฏิเสธ)
    const isDeadlinePassed = h.payment_deadline
        ? new Date(h.payment_deadline).getTime() < new Date().getTime()
        : false;
    const showCountdown =
        h.status !== "waiting_maid" &&
        (h.status === "waiting_payment" ||
            h.payment_status === "unpaid" ||
            h.payment_status === "rejected") &&
        h.payment_status !== "waiting_verify" &&
        !isCancelled &&
        h.payment_deadline &&
        !isDeadlinePassed;

    // แม่บ้านที่ยังรับผิดชอบงานนี้ (ไม่นับคนที่ถูกเปลี่ยนออก) และรับงานแล้วหรือยัง
    const assignedMaids = h.assigned_maids
        ? h.assigned_maids.filter((m) => m.maid_status !== "replaced")
        : [];
    const activeMaid = assignedMaids.length > 0 ? assignedMaids[0] : null;
    const isAllMaidsAccepted =
        activeMaid && activeMaid.maid_status === "accepted";

    // ขอคืนเงินได้ไหม: การจองถูกยกเลิก แต่จ่ายเงินไปแล้ว และยังไม่เคยขอคืน
    const isEligibleForRefund =
        isCancelled &&
        ["paid", "waiting_verify"].includes(h.payment_status) &&
        (!h.refund_status || h.refund_status === "none");
    // มือถือ: พับรายละเอียด (บริการ แม่บ้าน หมายเหตุ ความคืบหน้า) ไว้ก่อน ให้เห็นแค่ข้อมูลที่ต้องใช้ตัดสินใจ/กดดำเนินการ
    // จอ lg ขึ้นไปแสดงครบเสมอ จึงไม่กระทบเดสก์ท็อป
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div
            key={h.booking_id}
            className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,102,100,0.06)] transition-all duration-500 overflow-hidden flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] relative group hover:border-[#006664]/30`}
        >
            {/* แถบสีด้านบนการ์ด */}
            {!isCancelled && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#006664] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            )}

            {/* ส่วนที่ 1: หัวการ์ด (รหัสการจอง, สถานที่, วันที่, เวลา) */}
            <div className="px-5 pt-5 pb-2 sm:px-8 sm:pt-8 sm:pb-0 md:px-10 md:pt-10 lg:col-start-1 lg:row-start-1 relative">
                <BookingHeader
                    h={h}
                    date={date}
                    time={time}
                    showCountdown={showCountdown}
                    fetchHistory={fetchHistory}
                />
            </div>

            {/* Section 5-6: Price / Status / Actions (มือถืออยู่ใต้ Header เพื่อให้เห็นปุ่มหลักโดยไม่ต้องเลื่อน) */}
            <div
                className={`p-5 sm:p-6 md:p-8 flex flex-col justify-between lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:border-l border-slate-100/50 ${isCancelled ? "bg-slate-50/30" : "bg-gradient-to-b from-slate-50/30 to-white"}`}
            >
                <BookingPriceStatus
                    h={h}
                    timeline={timeline}
                    isPriceSet={isPriceSet}
                    isCancelled={isCancelled}
                    isCancelledNoMaid={isCancelledNoMaid}
                    isAllMaidsAccepted={isAllMaidsAccepted}
                    isNoShowReported={isNoShowReported}
                    isMaidLate={maidLate}
                />

                <BookingActions
                    h={h}
                    isEligibleForRefund={isEligibleForRefund}
                    setRefundModal={setRefundModal}
                    isCancelled={isCancelled}
                    isPriceSet={isPriceSet}
                    isDeadlinePassed={isDeadlinePassed}
                    setPayModal={setPayModal}
                    setReviewModal={setReviewModal}
                    handleViewEvidence={handleViewEvidence}
                    cancelBooking={cancelBooking}
                    isMaidLate={maidLate}
                    isCancelledNoMaid={isCancelledNoMaid}
                    goToBooking={goToBooking}
                    onOpenBankInfoModal={onOpenBankInfoModal}
                />
            </div>

            {/* ปุ่มพับ/ขยายรายละเอียด (เฉพาะมือถือ/แท็บเล็ตเล็ก) */}
            <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                aria-expanded={showDetails}
                className="lg:hidden w-full flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-slate-500 hover:text-[#006664] border-t border-slate-100/60 transition-colors"
            >
                {showDetails ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                <ChevronDown size={16} className={`transition-transform duration-300 ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {/* ส่วนที่ 2-4: บริการ / แม่บ้าน / หมายเหตุ / ไทม์ไลน์ */}
            <div
                className={`${showDetails ? "flex" : "hidden"} lg:flex flex-col justify-between px-5 pb-5 pt-2 sm:px-8 sm:pb-8 md:px-10 md:pb-10 lg:pt-0 lg:col-start-1 lg:row-start-2 relative`}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <BookingServices h={h} SERVICE_RULES={SERVICE_RULES} />

                    <BookingMaidInfo
                        h={h}
                        assignedMaids={assignedMaids}
                        isCancelled={isCancelled}
                    />
                </div>

                {h.customer_note && (
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => toggleNote(h.booking_id)}
                            className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 border border-slate-200 rounded-full px-3 py-1.5 hover:border-[#006664]/30 hover:text-[#006664] transition-colors"
                        >
                            <MessageSquareText size={14} /> หมายเหตุ
                            <ChevronDown
                                size={13}
                                className={`transition-transform duration-200 ${expandedNoteId === h.booking_id ? "rotate-180" : ""}`}
                            />
                        </button>
                        {expandedNoteId === h.booking_id && (
                            <div className="mt-2 p-4 rounded-2xl bg-[#B2BB1E]/5 border border-[#B2BB1E]/10 animate-in fade-in duration-200">
                                <p className="text-[13px] text-slate-600 leading-snug font-bold italic">
                                    "{h.customer_note}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <BookingTimeline
                    h={h}
                    timeline={timeline}
                    isCancelled={isCancelled}
                    isNoShowReported={isNoShowReported}
                />
            </div>
        </div>
    );
};

export default UserBookingCard;
