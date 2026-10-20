import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

const ViewReviewModal = ({ reviewText, onClose }) => {
    useLockBodyScroll();
    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                <h3 className="font-bold text-xl text-center text-[#006664] mb-6 flex items-center justify-center gap-2"><MessageSquare size={20} className="text-[#B2BB1E]"/> ความคิดเห็นจากผู้ใช้</h3>
                <div className="bg-slate-50 p-5 rounded-2xl text-sm text-slate-600 leading-relaxed border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar font-medium">
                    "{reviewText}"
                </div>
                <button onClick={onClose} className="w-full mt-6 bg-[#006664] text-[#B2BB1E] py-3.5 rounded-xl font-bold hover:bg-[#004d4b] transition-colors shadow-md active:scale-95">ปิดหน้าต่าง</button>
            </div>
        </div>
    );
};

export default ViewReviewModal;