import React from "react";
import { User, Phone } from "lucide-react";

const BookingMaidInfo = ({
    h,
    assignedMaids,
    isCancelled,
}) => {
    return (
        <div className="col-span-1 sm:col-span-2 md:col-span-3 mt-2">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 shrink-0 bg-[#006664]/10 rounded-lg flex items-center justify-center text-[#006664] shadow-sm">
                            <User size={13} strokeWidth={2.5} />
                        </div>
                        <p className="text-[12px] text-slate-500 font-extrabold uppercase tracking-widest">
                            พนักงานผู้ให้บริการ
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {assignedMaids.length === 0 ? (
                        isCancelled ? (
                            <div className="w-full p-4 rounded-xl bg-slate-50/50 text-center font-bold text-[13px] text-slate-400">
                                ไม่มีพนักงานรับงาน
                            </div>
                        ) : (
                            <div className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-center font-bold text-[13px] text-slate-500">
                                <span className="inline-flex items-center justify-center gap-1.5">
                                    กำลังค้นหาพนักงานที่พร้อมให้บริการ
                                    <span className="flex gap-0.5 ml-1">
                                        <span className="animate-pulse">.</span>
                                        <span className="animate-pulse [animation-delay:200ms]">.</span>
                                        <span className="animate-pulse [animation-delay:400ms]">.</span>
                                    </span>
                                </span>
                            </div>
                        )
                    ) : (
                        assignedMaids.map((maid, idx) => {
                            const name =
                                `${maid.title_prefix || ""}${maid.first_name || ""} ${maid.last_name || ""}`.trim() ||
                                `แม่บ้าน #${maid.maid_id}`;
                            const status = maid.maid_status;
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between border p-3.5 rounded-2xl transition-all w-full ${status === "replaced" ? "border-slate-100 bg-slate-50/50 opacity-60" : "border-slate-100 bg-white shadow-sm"}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-11 h-11 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                                            {maid.profile_pic ? (
                                                <img
                                                    src={
                                                        maid.profile_pic.startsWith(
                                                            "http",
                                                        )
                                                            ? maid.profile_pic
                                                            : `/backend-images${maid.profile_pic}`
                                                    }
                                                    alt={name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror =
                                                            null;
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=64748b`;
                                                    }}
                                                />
                                            ) : (
                                                <User
                                                    size={18}
                                                    className="text-slate-400"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={`text-[13px] font-extrabold truncate max-w-full ${status === "replaced" ? "text-slate-500 line-through" : "text-slate-800"}`}
                                            >
                                                {name}
                                            </p>
                                            {maid.phone &&
                                                status === "accepted" &&
                                                !isCancelled &&
                                                h.status !== "completed" &&
                                                h.status !== "no_show_reported" &&
                                                h.status !== "refund_requested" &&
                                                h.no_show_status !== "reported" && (
                                                    <div className="flex items-center gap-1 mt-0.5 text-[12px] text-slate-500 font-medium">
                                                        <Phone
                                                            size={12}
                                                            className="text-[#006664]"
                                                        />
                                                        <a
                                                            href={`tel:${maid.phone}`}
                                                            className="hover:text-[#006664] hover:underline transition-colors"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            {maid.phone}
                                                        </a>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingMaidInfo;
