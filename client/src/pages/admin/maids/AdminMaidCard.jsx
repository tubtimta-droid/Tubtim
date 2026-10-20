import React from 'react';
import { User, Phone, Star, Mail } from 'lucide-react';

const AdminMaidCard = ({ maid: m, rank, onViewProfile }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 group bg-white border-slate-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-[#006664]/20 hover:shadow-[0_8px_30px_rgba(0,102,100,0.06)]">
            <div className="flex items-start gap-4 md:gap-5 w-full md:w-auto mb-4 md:mb-0 relative">
                {/* ป้ายลำดับ (1-3 เป็นสีทอง เงิน ทองแดง) */}
                {typeof rank === 'number' && (
                    <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold shadow-sm border-2 border-white z-10 ${
                        rank === 1 ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-white' :
                        rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                        {rank}
                    </div>
                )}

                {/* รูปโปรไฟล์ */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden shadow-sm relative shrink-0 ring-[3px] ring-slate-50 bg-slate-100">
                    {m.profile_pic
                        ? <img src={`/backend-images${m.profile_pic}`} alt={m.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={26} strokeWidth={2.5} /></div>
                    }
                </div>

                {/* ชื่อและข้อมูลติดต่อ */}
                <div className="min-w-0 flex-1 pt-1">
                    <div className="font-extrabold text-slate-800 flex items-center flex-wrap gap-2 text-[17px] md:text-[19px] mb-2 tracking-normal">
                        <span className="truncate group-hover:text-[#006664] transition-colors">{m.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                            <Phone size={13} className="text-emerald-500"/> {m.phone || '-'}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 truncate max-w-[200px]">
                            <Mail size={13} className="text-blue-500"/> {m.email || '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ด้านขวาของการ์ด */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end md:pl-6 md:border-l md:border-slate-100/50">
                <div className="flex flex-col items-end gap-1 px-2 py-1">
                    <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-800">
                        <Star size={18} className="text-amber-400 fill-amber-400"/>
                        <span>{parseFloat(m.average_rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{m.total_reviews || 0} รีวิว</div>
                </div>
            </div>
        </div>
    );
};

export default AdminMaidCard;