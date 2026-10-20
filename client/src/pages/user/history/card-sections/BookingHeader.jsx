import React from "react";
import { MapPin, Calendar, Clock } from "lucide-react";
import CountdownTimer from "../CountdownTimer";

const BookingHeader = ({ h, date, time, showCountdown, fetchHistory }) => {
    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3 sm:mb-6">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                            #{h.booking_id}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm flex items-start gap-1.5 font-medium">
                        <MapPin
                            size={16}
                            className="text-slate-400 shrink-0 mt-0.5"
                        />
                        <span className="leading-snug">{h.location}</span>
                    </p>
                </div>

                <div className="shrink-0 hidden sm:flex flex-col items-end gap-2.5">
                    {showCountdown && (
                        <CountdownTimer
                            deadline={h.payment_deadline}
                            onExpire={fetchHistory}
                        />
                    )}
                </div>
            </div>

            {/* มือถือ: วันและเวลารวมบรรทัดเดียว + เวลานับถอยหลังชำระเงินให้เห็นทันที */}
            <div className="sm:hidden mb-2 space-y-2.5">
                <p className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
                    <Calendar size={15} className="text-slate-400 shrink-0" />
                    {date} · {time}
                </p>
                {showCountdown && (
                    <CountdownTimer deadline={h.payment_deadline} onExpire={fetchHistory} />
                )}
            </div>

            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100/50">
                        <Calendar size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">
                            วันนัดหมาย
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {date}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100/50">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">
                            เวลาทำงาน
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                            {time}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingHeader;