import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

const ApproveWithdrawModal = ({ onClose, onSubmit }) => {
    useLockBodyScroll();
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div 
                className="relative bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ส่วนหัว */}
                <div className="px-8 pt-8 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-normal">ยืนยันการโอนเงิน</h2>
                            <p className="text-[13px] text-slate-400 font-medium mt-0.5">ยืนยันให้สถานะการโอนเงินสำเร็จ</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <XCircle size={22} />
                        </button>
                    </div>
                </div>

                {/* เนื้อหา */}
                <div className="px-8 py-6">
                    <div className="bg-[#006664]/5 border-2 border-[#006664]/20 rounded-[1.5rem] p-6 text-center">
                        <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center text-[#006664] shadow-sm border border-[#006664]/20 mb-3">
                            <CheckCircle size={24} strokeWidth={2.5} />
                        </div>
                        <p className="text-[15px] font-bold text-slate-800 tracking-normal">คุณต้องการยืนยันการทำรายการนี้ใช่หรือไม่?</p>
                        <p className="text-[13px] text-slate-500 mt-1">หลังจากยืนยัน สถานะจะเปลี่ยนเป็น <b>"โอนเงินเรียบร้อย"</b> โดยอัตโนมัติ</p>
                    </div>
                </div>

                {/* ส่วนท้าย (ปุ่ม) */}
                <div className="px-8 py-6 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-[1.25rem] text-[15px] font-extrabold transition-all hover:bg-slate-50 active:scale-[0.98]"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={onSubmit} 
                        className="flex-1 py-4 bg-[#006664] hover:bg-[#005553] text-white rounded-[1.25rem] text-[15px] font-extrabold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,102,100,0.25)] hover:-translate-y-0.5"
                    >
                        <CheckCircle size={18} />
                        ยืนยันอนุมัติ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApproveWithdrawModal;