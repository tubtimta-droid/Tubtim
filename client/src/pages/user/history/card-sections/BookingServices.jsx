import React from "react";
import { ClipboardList } from "lucide-react";
import { SERVICE_ZONE_META } from "../../bookingConstants";

const BookingServices = ({ h, SERVICE_RULES }) => {
    // ไม่มีบริการในการจองนี้ → ไม่แสดงส่วนนี้
    if (!h.zones || h.zones.length === 0) return null;

    return (
        <div className="col-span-1 sm:col-span-2 md:col-span-3">
            <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className="w-6 h-6 shrink-0 bg-[#006664]/10 rounded-lg flex items-center justify-center text-[#006664] shadow-sm">
                    <ClipboardList size={13} strokeWidth={2.5} />
                </div>
                <p className="text-[12px] text-slate-500 font-extrabold uppercase tracking-widest">
                    บริการที่เลือก
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {h.zones.map((zone, i) => {
                    const meta = SERVICE_ZONE_META[zone];
                    const IconComp = meta?.icon;
                    const label = SERVICE_RULES[zone]?.label || zone;
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold text-[#006664] bg-[#006664]/[0.06] px-3 py-1.5 rounded-xl border border-[#006664]/10"
                        >
                            {IconComp && (
                                <IconComp
                                    size={14}
                                    strokeWidth={2}
                                    className="text-[#006664]/70"
                                />
                            )}
                            {label}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default BookingServices;
