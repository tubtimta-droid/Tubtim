import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = ({ toasts, removeToast }) => (
    // ✨ แก้ไข z-index ตรงนี้เป็น 99999 (สูงที่สุด)
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-3 pointer-events-none">
        
        {/* ✨ แก้ไขแล้ว: เพิ่ม index เข้าไปในวงเล็บ map และปรับ key ให้เป็นแบบรวม id กับ index เข้าด้วยกัน ป้องกันแจ้งเตือนซ้ำ */}
        {toasts.map((toast, index) => (
            <div key={`${toast.id}-${index}`} className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-3 transform transition-all duration-500 animate-in slide-in-from-right fade-in ${toast.type === 'success' ? 'bg-white border-emerald-500' : toast.type === 'error' ? 'bg-white border-red-500' : 'bg-white border-blue-500'}`}>
                <div className={`mt-0.5 ${toast.type === 'success' ? 'text-emerald-500' : toast.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
                    {toast.type === 'success' ? <CheckCircle size={20}/> : toast.type === 'error' ? <AlertCircle size={20}/> : <Info size={20}/>}
                </div>
                
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800">{toast.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{toast.message}</p>
                </div>
                
                <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
                    <X size={16}/>
                </button>
            </div>
        ))}
    </div>
);

export default ToastContainer;