import React from 'react';
import { User, Copy, XCircle, CheckCircle, Banknote, AlertTriangle } from 'lucide-react';

const WithdrawalCard = ({ withdrawal: w, onApproveClick, onRejectClick, copyToClipboard }) => {
    return (
        <div className={`bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,102,100,0.06)] transition-all duration-500 overflow-hidden relative group ${w.status === 'rejected' ? 'opacity-80' : ''}`}>
            
            {/* แถบสีด้านซ้าย (แสดงเมื่อเอาเมาส์ชี้) */}
            <div className="absolute top-0 left-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-80 transition-opacity duration-300 bg-[#006664]"></div>

            <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    
                    {/* ด้านซ้าย: ข้อมูลแม่บ้าน + บัญชีธนาคาร */}
                    <div className="flex-1 space-y-5">
                        {/* รูปและชื่อแม่บ้าน */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 shadow-sm ring-[3px] ring-slate-50 overflow-hidden">
                                {w.profile_pic ? (
                                    <img 
                                        src={w.profile_pic.startsWith('http') ? w.profile_pic : `/backend-images${w.profile_pic}`} 
                                        alt={w.maid_name} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <User size={24} strokeWidth={2.5} />
                                )}
                            </div>
                            <div>
                                <h3 className="text-[18px] font-extrabold text-slate-800 tracking-normal">{w.maid_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2.5 py-1 bg-teal-50 text-[#006664] text-[11px] font-extrabold rounded-lg border border-teal-100 shrink-0">
                                        ID: {w.maid_id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ข้อมูลบัญชีธนาคาร */}
                        <div className="bg-[#f8fafc] p-5 rounded-[1.5rem] border border-slate-100/60">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                                        <Banknote size={14} className="text-slate-400" />
                                        <span>ธนาคาร {w.bank_name}</span>
                                    </div>
                                    <div className="font-mono font-extrabold text-[18px] tracking-wider text-slate-800">
                                        {w.bank_account_number}
                                    </div>
                                    <div className="text-[13px] text-slate-400 font-medium">
                                        ชื่อบัญชี: {w.bank_account_name}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(w.bank_account_number)} 
                                    className="p-3 bg-white hover:bg-[#006664] text-slate-400 hover:text-white rounded-[1rem] transition-all border border-slate-200 hover:border-[#006664] shadow-sm hover:shadow-md active:scale-95 shrink-0" 
                                    title="คัดลอกเลขบัญชี"
                                >
                                    <Copy size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* วันที่ขอถอน */}
                        <div className="text-[12px] text-slate-400 font-medium px-1">
                            วันที่ทำรายการ: {new Date(w.request_date).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })}
                        </div>
                    </div>
                    
                    {/* ด้านขวา: ยอดเงิน + ปุ่ม */}
                    <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-4 md:border-l md:border-slate-100/50 md:pl-8 md:min-w-[220px]">
                        
                        {/* ยอดเงินที่ขอถอน */}
                        <div className="flex flex-col items-start md:items-end">
                            <span className="text-[11px] font-extrabold text-slate-400 mb-1 uppercase tracking-[0.15em]">ยอดถอน</span>
                            <div className={`text-3xl leading-none font-extrabold tracking-normal ${w.status === 'rejected' ? 'text-slate-400 line-through' : 'text-[#006664]'}`}>
                                ฿{parseFloat(w.amount || 0).toFixed(2)}
                            </div>
                        </div>

                        {/* ป้ายสถานะ (รายการที่ดำเนินการแล้ว) */}
                        {w.status !== 'pending' && (
                            <span className={`inline-flex px-3.5 py-2 rounded-full text-[12px] font-bold border items-center gap-1.5 shadow-sm ${
                                w.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                                {w.status === 'approved' ? (
                                    <><CheckCircle size={14}/> โอนเงินเรียบร้อย</>
                                ) : (
                                    <><XCircle size={14}/> ปฏิเสธการถอน</>
                                )}
                            </span>
                        )}

                        {/* กล่องเหตุผลที่ปฏิเสธ */}
                        {w.status === 'rejected' && w.reject_reason && (
                            <div className="flex items-start gap-3 bg-rose-50/60 border border-rose-100/60 p-4 rounded-[1.25rem] w-full">
                                <div className="bg-rose-100/80 p-1.5 rounded-full shrink-0 mt-0.5">
                                    <AlertTriangle size={12} className="text-rose-600" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">เหตุผล</span>
                                    <span className="text-[13px] text-rose-600/90 leading-relaxed font-medium">
                                        {w.reject_reason}
                                    </span>
                                </div>
                            </div>
                        )}



                        {/* ปุ่มอนุมัติ / ปฏิเสธ (รายการที่รอดำเนินการ) */}
                        {w.status === 'pending' && (
                            <div className="flex flex-col w-full gap-3 mt-2">
                                <button 
                                    onClick={() => onApproveClick(w.id)} 
                                    className="w-full py-4 px-4 bg-[#006664] hover:bg-[#005553] text-white rounded-[1.25rem] text-[14px] font-extrabold shadow-[0_8px_20px_rgba(0,102,100,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 hover:-translate-y-0.5"
                                >
                                    <CheckCircle size={18}/> แจ้งโอนเงินแล้ว
                                </button>
                                
                                <button 
                                    onClick={() => onRejectClick(w)} 
                                    className="w-full py-3.5 bg-white text-rose-500 hover:bg-rose-50 border-2 border-slate-100 hover:border-rose-200 rounded-[1.25rem] text-[13px] font-extrabold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <XCircle size={16}/> ปฏิเสธคำขอ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalCard;