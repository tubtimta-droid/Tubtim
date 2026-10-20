import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const RefundModal = ({ booking, onClose, onSubmit, mode = 'refund' }) => {
    useLockBodyScroll();
    // ข้อมูลบัญชีธนาคาร, เหตุผลที่เลือก/พิมพ์, รูปหลักฐาน และข้อความแจ้งช่องที่กรอกไม่ครบ
    const [form, setForm] = useState({ bank_name: 'ธนาคารกสิกรไทย', account_number: '', account_name: '' });
    const [selectedReasonOption, setSelectedReasonOption] = useState('');
    const [reason, setReason] = useState('');
    const [evidences, setEvidences] = useState([]);
    const [errors, setErrors] = useState({});
    const isNoShow = mode === 'no_show';

    // เหตุผลสำเร็จรูปตอนขอคืนเงิน
    const REFUND_REASONS = [
        "พนักงานทำความสะอาดไม่เรียบร้อย",
        "พนักงานทำทรัพย์สินสูญหาย หรือได้รับความเสียหาย",
        "ทำผิดห้อง/ผิดสถานที่",
        "อื่นๆ (โปรดระบุ)"
    ];

    const isBankInfoOnly = mode === 'bank_info';
    const NO_SHOW_REASON = 'แม่บ้านไม่มาตามนัด (เลยเวลานัดเกิน 20 นาที)';
    // no_show: เหตุผลเป็นแบบอัตโนมัติ ลูกค้ากรอกเฉพาะข้อมูลบัญชี
    const needsReasonField = !isBankInfoOnly && !isNoShow;

    // กดส่ง: ตรวจว่ากรอกครบตามโหมด แล้วส่งข้อมูลให้ UserHistoryTab เรียก API
    const handleSubmit = () => {
        const newErrors = {};

        if (needsReasonField) {
            const finalReason = mode === 'refund' && selectedReasonOption && selectedReasonOption !== 'อื่นๆ (โปรดระบุ)'
                ? selectedReasonOption
                : reason.trim();

            if (!finalReason) {
                newErrors.reason = mode === 'refund' && selectedReasonOption === 'อื่นๆ (โปรดระบุ)'
                    ? 'กรุณาระบุเหตุผลเพิ่มเติม'
                    : mode === 'refund'
                        ? 'กรุณาเลือกเหตุผลในการขอคืนเงิน'
                        : 'กรุณาระบุรายละเอียดปัญหา';
            }
            if (!isNoShow && evidences.length === 0) {
                newErrors.evidences = 'กรุณาแนบรูปภาพหลักฐานอย่างน้อย 1 รูป';
            }
        }
        if (!form.account_number) newErrors.account_number = 'กรุณากรอกเลขบัญชี / พร้อมเพย์';
        if (!form.account_name) newErrors.account_name = 'กรุณากรอกชื่อบัญชี';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        if (isBankInfoOnly) {
            onSubmit(booking.booking_id, {
                bank_name: form.bank_name,
                account_number: form.account_number,
                account_name: form.account_name
            });
            return;
        }

        const finalReason = isNoShow
            ? NO_SHOW_REASON
            : mode === 'refund' && selectedReasonOption && selectedReasonOption !== 'อื่นๆ (โปรดระบุ)'
                ? selectedReasonOption
                : reason.trim();
        onSubmit(booking.booking_id, {
            reason_type: mode === 'refund' ? 'refund_request' : mode,
            reason_text: finalReason,
            bank_name: form.bank_name,
            account_number: form.account_number,
            account_name: form.account_name,
            evidences: evidences
        });
    };

    // หัวข้อและคำอธิบายของป๊อปอัปตามโหมด
    const titles = {
        no_show: { heading: 'แม่บ้านไม่มาตามนัด', sub: 'กรุณากรอกบัญชีธนาคาร ทีมดูแลจะตรวจสอบและโอนเงินคืนให้คุณ' },
        refund: { heading: 'แจ้งขอคืนเงิน', sub: 'กรุณาระบุบัญชีธนาคารเพื่อให้ทีมดูแลดำเนินการโอนเงินคืน' },
        bank_info: { heading: 'แจ้งบัญชีเพื่อรับเงินคืน', sub: 'ผู้ให้บริการแจ้งปัญหาในงานนี้ กรุณาระบุบัญชีธนาคารเพื่อรับเงินคืน' },
    };
    const { heading, sub } = titles[mode] || titles.refund;

    return (
        <div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl max-w-[400px] w-full relative overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

                {/* ปุ่มปิด */}
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full z-50 transition-all">
                    <X size={16} />
                </button>

                {/* ส่วนหัว */}
                <div className="bg-gradient-to-br from-[#006664] to-[#008480] px-6 pt-7 pb-5 text-center shrink-0">
                    <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/10">
                        {isNoShow ? <AlertTriangle size={22} className="text-white" /> : <ShieldCheck size={22} className="text-white" />}
                    </div>
                    <h3 className="font-bold text-[17px] text-white leading-snug">{heading}</h3>
                    <p className="text-[11px] font-medium mt-1.5 text-white/70 leading-relaxed px-2">{sub}</p>
                </div>

                {/* ป้ายยอดเงิน */}
                <div className="px-5 -mt-3 shrink-0">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดเงินที่จะได้รับคืน</span>
                        <div className="font-extrabold text-[28px] text-slate-800 tracking-normal leading-none mt-1">฿{Number(isBankInfoOnly ? booking.refund_amount : booking.total_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                        {!isNoShow && !isBankInfoOnly && (
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">(ขึ้นอยู่กับผลการตรวจสอบ)</span>
                        )}
                    </div>
                </div>

                {/* ฟอร์มกรอกข้อมูล */}
                <div className="p-5 pt-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
                    {needsReasonField && (
                    <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-0.5 mb-1 block">
                            {mode === 'refund' ? 'เหตุผลที่ขอคืนเงิน' : 'รายละเอียดปัญหา'} <span className="text-red-500">*</span>
                        </label>

                        {mode === 'refund' && (
                            <div className="relative mb-2">
                                <select 
                                    className={`w-full p-3 appearance-none bg-slate-50/80 border rounded-xl text-sm outline-none focus:border-[#006664] focus:bg-white font-medium transition-all ${errors.reason && !selectedReasonOption ? 'border-red-300 bg-red-50/30' : 'border-slate-200/80'} ${selectedReasonOption === '' ? 'text-slate-400' : 'text-slate-700'}`}
                                    value={selectedReasonOption}
                                    onChange={(e) => {
                                        setSelectedReasonOption(e.target.value);
                                        if (e.target.value !== 'อื่นๆ (โปรดระบุ)') setReason('');
                                        if (errors.reason) setErrors({ ...errors, reason: null });
                                    }}
                                >
                                    <option value="" disabled>-- เลือกเหตุผลที่ขอคืนเงิน --</option>
                                    {REFUND_REASONS.map(r => <option key={r} value={r} className="text-slate-700">{r}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        )}

                        { (mode !== 'refund' || selectedReasonOption === 'อื่นๆ (โปรดระบุ)') && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <textarea
                                    className={`w-full p-3 bg-slate-50/80 border rounded-xl text-sm outline-none font-medium resize-none transition-all placeholder:text-slate-300 ${errors.reason && (!selectedReasonOption || selectedReasonOption === 'อื่นๆ (โปรดระบุ)') ? 'border-red-300 focus:border-red-400 bg-red-50/30' : 'border-slate-200/80 focus:border-[#006664] focus:bg-white'}`}
                                    placeholder={mode === 'no_show' ? "เช่น ถึงเวลานัดแล้ว 20 นาทีแต่ยังไม่มีพนักงานมาถึง" : mode === 'refund' ? 'โปรดระบุเหตุผลเพิ่มเติม...' : "ระบุรายละเอียดปัญหาที่พบ"}
                                    rows={2}
                                    value={reason}
                                    onChange={e => { setReason(e.target.value); if (errors.reason) setErrors({ ...errors, reason: null }); }}
                                />
                            </div>
                        )}
                        {errors.reason && <p className="text-[10px] font-bold text-red-500 ml-0.5 mt-0.5 animate-in fade-in duration-200">{errors.reason}</p>}
                        
                        {!isNoShow && (
                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-[11px] font-bold text-slate-500 ml-0.5 mb-1 block">
                                รูปภาพหลักฐาน (อย่างน้อย 1 รูป) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setEvidences([...evidences, ...Array.from(e.target.files)].slice(0, 4));
                                        if (errors.evidences) setErrors({ ...errors, evidences: null });
                                    }
                                    e.target.value = null;
                                }}
                                className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#006664]/10 file:text-[#006664] hover:file:bg-[#006664]/20 transition cursor-pointer ${errors.evidences ? 'text-red-500 file:bg-red-50 file:text-red-600' : ''}`}
                            />
                            <p className="text-[10px] text-slate-400 ml-0.5 mt-1">สามารถอัปโหลดได้สูงสุด 4 รูป</p>
                            {errors.evidences && <p className="text-[10px] font-bold text-red-500 ml-0.5 mt-0.5 animate-in fade-in duration-200">{errors.evidences}</p>}

                            {evidences.length > 0 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 custom-scrollbar">
                                    {evidences.map((file, idx) => (
                                        <div key={idx} className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setEvidences(evidences.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors backdrop-blur-sm shadow-sm"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                    )}

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-0.5 mb-1 block">ธนาคาร <span className="text-red-500">*</span></label>
                        <select className="w-full p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm outline-none focus:border-[#006664] focus:bg-white font-medium text-slate-700 transition-all" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}>
                            <option>ธนาคารกสิกรไทย (KBank)</option>
                            <option>ธนาคารไทยพาณิชย์ (SCB)</option>
                            <option>ธนาคารกรุงเทพ (BBL)</option>
                            <option>ธนาคารกรุงไทย (KTB)</option>
                            <option>ธนาคารกรุงศรีฯ (BAY)</option>
                            <option>ธนาคารออมสิน (GSB)</option>
                            <option>พร้อมเพย์ (PromptPay)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-0.5 mb-1 block">เลขบัญชี / เบอร์พร้อมเพย์ <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full p-3 bg-slate-50/80 border rounded-xl text-sm outline-none font-mono font-bold tracking-wider transition-all placeholder:text-slate-300 placeholder:font-normal ${errors.account_number ? 'border-red-300 focus:border-red-400 bg-red-50/30' : 'border-slate-200/80 focus:border-[#006664] focus:bg-white'}`}
                            placeholder="XXX-X-XXXXX-X"
                            value={form.account_number}
                            onChange={e => { 
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setForm({ ...form, account_number: val }); 
                                if (errors.account_number) setErrors({ ...errors, account_number: null }); 
                            }}
                        />
                        {errors.account_number && <p className="text-[10px] font-bold text-red-500 ml-0.5 mt-0.5 animate-in fade-in duration-200">{errors.account_number}</p>}
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-slate-500 ml-0.5 mb-1 block">ชื่อบัญชี <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className={`w-full p-3 bg-slate-50/80 border rounded-xl text-sm outline-none font-medium transition-all placeholder:text-slate-300 ${errors.account_name ? 'border-red-300 focus:border-red-400 bg-red-50/30' : 'border-slate-200/80 focus:border-[#006664] focus:bg-white'}`}
                            placeholder="ชื่อ - นามสกุล"
                            value={form.account_name}
                            onChange={e => { 
                                const val = e.target.value.replace(/[^a-zA-Zก-ฮะ-์\s]/g, '');
                                setForm({ ...form, account_name: val }); 
                                if (errors.account_name) setErrors({ ...errors, account_name: null }); 
                            }}
                        />
                        {errors.account_name && <p className="text-[10px] font-bold text-red-500 ml-0.5 mt-0.5 animate-in fade-in duration-200">{errors.account_name}</p>}
                    </div>
                </div>

                {/* ปุ่มส่ง */}
                <div className="px-5 pb-5 pt-2 shrink-0">
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-[#006664] hover:bg-[#005553] text-white py-3.5 rounded-2xl font-bold transition-all shadow-[0_8px_30px_rgba(0,102,100,0.25)] active:scale-[0.97] flex items-center justify-center gap-2 text-[14px]"
                    >
                        {mode === 'no_show' ? 'ยืนยันรายงานและขอคืนเงิน' : isBankInfoOnly ? 'ส่งข้อมูลบัญชี' : 'ยืนยันส่งคำขอคืนเงิน'}
                        <ArrowRight size={16} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RefundModal;