import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

// เหตุผลสำเร็จรูปให้เลือก ('other' = พิมพ์เหตุผลเอง)
const PRESET_REASONS = [
    { id: 'wrong_account', label: 'ข้อมูลบัญชีไม่ถูกต้อง' },
    { id: 'amount_mismatch', label: 'ยอดเงินไม่ตรงกับระบบ' },
    { id: 'suspended', label: 'บัญชีถูกระงับชั่วคราว' },
    { id: 'duplicate', label: 'รายการซ้ำ / คำขอถอนซ้ำ' },
    { id: 'other', label: 'อื่นๆ (ระบุเอง)' },
];

const RejectWithdrawModal = ({ withdrawal, onClose, onSubmit }) => {
    useLockBodyScroll();
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // เหตุผลที่จะส่งจริง: ข้อความที่พิมพ์เอง หรือข้อความของเหตุผลสำเร็จรูปที่เลือก
    const getFinalReason = () => {
        if (selectedReason === 'other') return customReason.trim();
        const preset = PRESET_REASONS.find(r => r.id === selectedReason);
        return preset ? preset.label : '';
    };

    // กดยืนยันได้เมื่อเลือกเหตุผลแล้ว (และถ้าเลือก 'อื่นๆ' ต้องพิมพ์ด้วย)
    const canSubmit = selectedReason !== '' && (selectedReason !== 'other' || customReason.trim() !== '');

    const handleSubmit = async () => {
        if (!canSubmit || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(withdrawal.id, getFinalReason());
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div 
                className="relative bg-white rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ส่วนหัว */}
                <div className="sticky top-0 bg-white z-10 px-8 pt-8 pb-4 border-b border-slate-100 rounded-t-[2rem]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
                                <AlertTriangle size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-normal">ปฏิเสธคำขอถอนเงิน</h2>
                                <p className="text-[13px] text-slate-400 font-medium mt-0.5">
                                    ยอด ฿{parseFloat(withdrawal?.amount || 0).toFixed(2)} · {withdrawal?.maid_name || 'พนักงาน'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <XCircle size={22} />
                        </button>
                    </div>
                </div>

                {/* เนื้อหา */}
                <div className="px-8 py-6 space-y-5">
                    <div>
                        <label className="text-[13px] font-extrabold text-slate-700 uppercase tracking-[0.1em] mb-3 block">
                            เลือกเหตุผลการปฏิเสธ
                        </label>
                        <div className="space-y-2.5">
                            {PRESET_REASONS.map((reason) => {
                                const isSelected = selectedReason === reason.id;
                                return (
                                    <button
                                        key={reason.id}
                                        onClick={() => setSelectedReason(reason.id)}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.25rem] border-2 text-left transition-all duration-200 group ${
                                            isSelected
                                                ? 'border-rose-300 bg-rose-50/50 shadow-sm'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                                isSelected ? 'border-rose-500 bg-rose-500' : 'border-slate-300 group-hover:border-slate-400'
                                            }`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-[15px] font-bold ${isSelected ? 'text-rose-700' : 'text-slate-700'}`}>
                                                {reason.label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ช่องพิมพ์เหตุผลเอง (เมื่อเลือก อื่นๆ) */}
                    {selectedReason === 'other' && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                            <label className="text-[13px] font-bold text-slate-600 mb-2 block">
                                ระบุเหตุผล <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="พิมพ์เหตุผลของคุณที่นี่..."
                                rows={3}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.25rem] text-[15px] text-slate-700 font-medium outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all resize-none placeholder:text-slate-400 placeholder:font-normal"
                            />
                        </div>
                    )}
                </div>

                {/* ส่วนท้าย (ปุ่ม) */}
                <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-slate-100 rounded-b-[2rem] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-[1.25rem] text-[15px] font-extrabold transition-all hover:bg-slate-50 active:scale-[0.98]"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className={`flex-1 py-4 rounded-[1.25rem] text-[15px] font-extrabold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                            canSubmit && !isSubmitting
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_8px_20px_rgba(244,63,94,0.25)] hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <XCircle size={18} />
                        {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectWithdrawModal;
