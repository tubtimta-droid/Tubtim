import React from 'react';
import { User, Star, Award, ShieldCheck } from 'lucide-react';

const TopMaidsRanking = ({ topMaids }) => {
    // ไม่มีข้อมูลแม่บ้าน → ไม่แสดงแท่นอันดับ
    if (topMaids.length === 0) return null;

    return (
        <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 mb-10 pt-6 animate-in slide-in-from-bottom-4">
            {/* อันดับ 2 */}
            {topMaids.length > 1 && (
                <div className="bg-white w-full md:w-[30%] p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative order-2 md:order-1 transition-transform hover:-translate-y-1">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-300 mb-4 shadow-sm relative">
                        <div className="absolute -top-1 -left-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-400 font-extrabold text-xs shadow-md border border-slate-100 z-10">2</div>
                        <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white shadow-inner">
                            {topMaids[1].profile_pic ? (
                                <img
                                    src={topMaids[1].profile_pic.startsWith('http') ? topMaids[1].profile_pic : `/backend-images${topMaids[1].profile_pic}`}
                                    alt={topMaids[1].name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topMaids[1].name)}&background=f1f5f9&color=64748b`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><User size={32} /></div>
                            )}
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg mb-1">{topMaids[1].name}</h3>
                    <div className="flex items-center gap-1.5 text-sm bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-700">{topMaids[1].average_rating || '0.0'}</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-xs text-slate-500 font-medium">{topMaids[1].total_reviews || 0} รีวิว</span>
                    </div>
                </div>
            )}

            {/* อันดับ 1 (โดดเด่นสุด) */}
            {topMaids.length > 0 && (
                <div className="bg-white w-full md:w-[36%] p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(200,160,50,0.06)] border border-amber-100/50 flex flex-col items-center relative order-1 md:order-2 z-10 md:-translate-y-4">
                    <div className="absolute -top-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-full shadow-md tracking-widest uppercase flex items-center gap-1.5">
                        <Award size={12} className="text-amber-100" /> Top Rated
                    </div>
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-amber-300 via-amber-100 to-amber-500 mb-5 shadow-lg relative">
                        <div className="absolute -top-1 -left-1 w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-500 font-extrabold text-sm shadow-md border border-amber-100 z-10">1</div>
                        <div className="w-full h-full rounded-full bg-white overflow-hidden border-[4px] border-white shadow-inner">
                            {topMaids[0].profile_pic ? (
                                <img
                                    src={topMaids[0].profile_pic.startsWith('http') ? topMaids[0].profile_pic : `/backend-images${topMaids[0].profile_pic}`}
                                    alt={topMaids[0].name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topMaids[0].name)}&background=f1f5f9&color=64748b`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-300"><User size={40} /></div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <h3 className="font-extrabold text-2xl text-slate-800">{topMaids[0].name}</h3>
                        <ShieldCheck size={20} className="text-[#006664]" />
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100">
                        <Star size={16} className="text-amber-500 fill-amber-500" />
                        <span className="font-extrabold text-amber-700">{topMaids[0].average_rating || '0.0'}</span>
                        <span className="text-amber-200 mx-1">|</span>
                        <span className="text-xs text-amber-600 font-bold">{topMaids[0].total_reviews || 0} รีวิว</span>
                    </div>
                </div>
            )}

            {/* อันดับ 3 */}
            {topMaids.length > 2 && (
                <div className="bg-white w-full md:w-[30%] p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative order-3 transition-transform hover:-translate-y-1">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-stone-300 via-stone-100 to-stone-300 mb-4 shadow-sm relative">
                        <div className="absolute -top-1 -left-1 w-7 h-7 bg-white rounded-full flex items-center justify-center text-stone-500 font-extrabold text-xs shadow-md border border-slate-100 z-10">3</div>
                        <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white shadow-inner">
                            {topMaids[2].profile_pic ? (
                                <img
                                    src={topMaids[2].profile_pic.startsWith('http') ? topMaids[2].profile_pic : `/backend-images${topMaids[2].profile_pic}`}
                                    alt={topMaids[2].name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(topMaids[2].name)}&background=f1f5f9&color=64748b`;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-stone-300"><User size={32} /></div>
                            )}
                        </div>
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg mb-1">{topMaids[2].name}</h3>
                    <div className="flex items-center gap-1.5 text-sm bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-700">{topMaids[2].average_rating || '0.0'}</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-xs text-slate-500 font-medium">{topMaids[2].total_reviews || 0} รีวิว</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopMaidsRanking;