import React, { useState } from 'react';
import { X, CheckCircle, Wallet, AlertCircle, XCircle } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

const UploadRefundSlipModal = ({ booking, onClose, onSubmit }) => {
    useLockBodyScroll();
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // status = 'refunded' (อนุมัติ) หรือ 'rejected' (ปฏิเสธ — บังคับกรอกเหตุผล)
    const handleAction = async (status) => {
        if (status === 'rejected' && !adminNote.trim()) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธการคืนเงิน');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit(booking.id || booking.booking_id, status, adminNote);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.2)] max-w-md w-full overflow-hidden relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-slate-100 flex flex-col">
                
                {/* ส่วนหัว (พื้นหลังไล่สี) */}
                <div className="bg-gradient-to-br from-[#006664] to-[#018b88] p-7 text-center text-white relative shrink-0">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-1.5 bg-white/10 text-white/80 rounded-full hover:bg-white/20 hover:text-white z-10 transition-all active:scale-90"
                    >
                        <X size={16}/>
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/10">
                        <Wallet size={24} className="text-white" />
                    </div>
                    <h3 className="font-bold text-xl tracking-normal">จัดการการคืนเงิน</h3>
                    <p className="text-teal-50/70 text-[11px] font-medium mt-1 uppercase tracking-wider">ตรวจสอบคำขอและตัดสินผล</p>
                </div>

                <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    
                    {/* สรุปเรื่องที่ลูกค้าแจ้ง */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">ข้อมูลการแจ้งปัญหาจากลูกค้า</label>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <AlertCircle size={16} className="text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">เหตุผลที่แจ้ง</span>
                                    <p className="text-slate-700 text-[13px] font-medium leading-relaxed italic">
                                        "{booking.reason_text || booking.no_show_reason || 'ไม่ได้ระบุเหตุผล'}"
                                    </p>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">ธนาคาร</span>
                                    <span className="text-slate-700 text-[13px] font-bold">{booking.refund_bank_name || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">ชื่อบัญชี</span>
                                    <span className="text-slate-700 text-[13px] font-bold">{booking.refund_account_name || '-'}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">เลขบัญชี (สำหรับการโอนคืนภายนอก)</span>
                                    <span className="text-[#006664] text-[15px] font-extrabold font-mono tracking-wider">{booking.refund_account_number || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ช่องหมายเหตุของแอดมิน */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                            <span>ระบุเหตุผลการพิจารณา</span>
                            <span className="text-[10px] normal-case font-medium text-slate-400">กรอกเพื่อส่งให้ลูกค้าทราบ</span>
                        </label>
                        <textarea 
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="ตัวอย่าง: ได้รับเงินคืนเรียบร้อยแล้ว, ปฏิเสธการคืนเงินเนื่องจากตรวจสอบแล้วพนักงานเข้าทำงานจริง ฯลฯ"
                            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] focus:ring-4 focus:ring-teal-500/10 focus:border-[#006664] outline-none transition-all resize-none font-medium text-slate-700 placeholder:text-slate-300"
                        />
                    </div>

                    {/* ปุ่มอนุมัติ / ปฏิเสธ */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                            onClick={() => handleAction('rejected')} 
                            disabled={isSubmitting}
                            className="bg-white text-rose-600 border border-rose-100 py-3.5 rounded-2xl font-bold hover:bg-rose-50 transition-all text-[14px] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <XCircle size={18}/> ปฏิเสธคืนเงิน
                        </button>
                        <button 
                            onClick={() => handleAction('refunded')} 
                            disabled={isSubmitting}
                            className="bg-[#006664] text-white py-3.5 rounded-2xl font-bold hover:bg-[#005553] shadow-lg shadow-teal-900/10 transition-all text-[14px] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle size={18}/> อนุมัติคืนเงิน
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-slate-400 animate-pulse">
                        * เมื่ออนุมัติ ระบบจะเปลี่ยนสถานะรายการจองเป็น "คืนเงินแล้ว" โดยอัตโนมัติ
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadRefundSlipModal;