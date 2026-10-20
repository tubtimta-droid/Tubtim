import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'warning' }) => {
    // ล็อกการเลื่อนหน้าเว็บด้านหลังขณะป๊อปอัปเปิด
    useLockBodyScroll(isOpen);

    // ไม่ได้เปิด → ไม่ต้องแสดงอะไรเลย
    if (!isOpen) return null;

    return (
        // ใส่ z-[99999] เพื่อให้ลอยอยู่ชั้นบนสุดเสมอ ไม่ถูกหน้าต่างไหนบัง
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            
            {/* พื้นหลังสีดำโปร่งแสง */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
            
            {/* ตัวกล่องข้อความ */}
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 relative z-10 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">

                {/* ไอคอนด้านบน เปลี่ยนสีตามประเภท */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
                    type === 'danger' ? 'bg-red-50 text-red-500' :
                    type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-amber-50 text-amber-500'
                }`}>
                    {type === 'danger' ? <AlertTriangle size={32} /> :
                     type === 'success' ? <CheckCircle size={32} /> :
                     <AlertTriangle size={32} />}
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">{message}</p>

                <div className="flex gap-3 w-full">
                    {/* ปุ่มยกเลิก */}
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    
                    {/* ปุ่มยืนยัน เปลี่ยนสีตามประเภท */}
                    <button 
                        onClick={onConfirm} 
                        className={`flex-1 py-3.5 rounded-xl text-white font-bold shadow-md transition-all active:scale-95 ${
                            type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' :
                            type === 'success' ? 'bg-[#006664] hover:bg-[#004d4b] shadow-[#006664]/30' :
                            'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                        }`}
                    >
                        ยืนยัน
                    </button>
                </div>
                
            </div>
        </div>
    );
};

export default ConfirmModal;