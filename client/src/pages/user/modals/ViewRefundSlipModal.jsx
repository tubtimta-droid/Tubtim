import React from 'react';
import { X, CheckCircle } from 'lucide-react';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const ViewRefundSlipModal = ({ slipPath, onClose }) => {
    useLockBodyScroll();
    return (
        <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] max-w-sm w-full relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
                
                <div className="bg-emerald-600 p-5 text-center text-white relative shrink-0">
                    <button onClick={onClose} className="absolute top-1/2 -translate-y-1/2 right-4 p-1.5 bg-white/20 text-white rounded-full hover:bg-white/30 z-10 transition-colors"><X size={16}/></button>
                    <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                        <CheckCircle size={20}/> หลักฐานการโอนเงินคืน
                    </h3>
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center bg-slate-50">
                    <img src={`/backend-images${slipPath}`} className="w-full h-auto object-contain rounded-xl shadow-sm border border-slate-200" alt="Refund Slip"/>
                </div>

                <div className="p-5 shrink-0 bg-white border-t border-slate-100">
                    <button onClick={onClose} className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm shadow-sm active:scale-95">
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewRefundSlipModal;