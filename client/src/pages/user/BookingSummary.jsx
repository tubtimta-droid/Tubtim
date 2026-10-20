import React, { useState } from 'react';
import { Calendar, BoxSelect, ChevronRight, ChevronLeft, CheckCircle, MessageSquareText, Layers, Wallet, Building2 } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

/**
 * คอมโพเนนต์: BookingSummary
 * หน้าที่: แสดงแถบสรุปข้อมูลการจอง (Sidebar บนคอม / Bottom Bar บนมือถือ)
 * รับ Props ต่างๆ มาจาก UserBookingTab 
 */
const BookingSummary = ({ 
    selectedBuilding, 
    selectedRoom, 
    locationString, 
    selectedZones, 
    serviceZones, 
    dormType, 
    totalPrice, 
    submitBooking, 
    currentStep, 
    onNext, 
    onBack, 
    form 
}) => {
    // เปิด/ปิดป๊อปอัปยืนยันก่อนส่งการจอง
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    useLockBodyScroll(showConfirmModal);

    return (
        <>
            {/* ========================================================
                1. ส่วนแสดงผลบนคอมพิวเตอร์ (Desktop Right Panel) 
                ======================================================== */}
            <div className="hidden lg:block lg:col-span-4 relative">
                <div className="bg-white rounded-[2.5rem] shadow-[0_12px_30px_rgba(0,0,0,0.04)] border border-slate-100/50 sticky top-28 overflow-hidden flex flex-col group/card transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,102,100,0.06)]">
                    
                    {/* Header: หัวข้อ */}
                    <div className="p-8 pb-6 text-center relative overflow-hidden bg-gradient-to-br from-[#006664] to-[#00807D]">
                        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-white/5 [clip-path:polygon(0_0,100%_0,0_100%)]"></div>
                        <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white mx-auto mb-3 ring-4 ring-white/10">
                            <BoxSelect size={22} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-extrabold text-[22px] text-white tracking-normal relative z-10">สรุปข้อมูลการจอง</h3>
                        <div className="h-1 w-12 bg-[#B2BB1E] rounded-full mx-auto mt-2.5 opacity-80"></div>
                    </div>

                    <div className="px-8 pb-10 space-y-6">
                        <div className="space-y-0">
                            
                            {/* ส่วนที่ 1: สถานที่ (Location) */}
                            <div className="flex items-center gap-4 py-4 transition-all duration-500">
                                <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/card:bg-[#006664]/5 group-hover/card:text-[#006664] transition-colors border border-slate-100/50">
                                    <Building2 size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">สถานที่</span>
                                    <div className="font-bold text-slate-800 text-[15px] pr-2 leading-relaxed">
                                        {locationString || <span className="text-slate-300">ยังไม่ได้เลือก</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-100"></div>

                            {/* ส่วนที่ 2: บริการที่เลือก (Services) */}
                            <div className={`flex items-start gap-4 py-4 transition-all duration-500 ${currentStep < 2 ? 'opacity-40' : 'opacity-100'}`}>
                                <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/card:bg-[#006664]/5 group-hover/card:text-[#006664] transition-colors border border-slate-100/50">
                                    <Layers size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">บริการที่เลือก</span>
                                    {selectedZones.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {selectedZones.map((zId) => {
                                                const zone = serviceZones?.find((z) => z.id === zId);
                                                return (
                                                    <span 
                                                        key={zId} 
                                                        className="inline-flex items-center gap-1 font-bold text-[#006664] bg-[#006664]/5 border border-[#006664]/10 rounded-md px-2 py-0.5 text-[13px]"
                                                    >
                                                        {zone?.label || zId}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="font-bold text-slate-300 text-[15px] mt-1">-</div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-100"></div>

                            {/* ส่วนที่ 3: ราคาสุทธิ (Total Price) */}
                            <div className={`flex items-center gap-4 py-4 transition-all duration-500 ${currentStep < 2 ? 'opacity-40' : 'opacity-100'}`}>
                                <div className="bg-[#006664]/5 rounded-xl p-2.5 flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center text-[#B2BB1E] border border-slate-100/50 shadow-sm">
                                        <Wallet size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">ราคาสุทธิ</span>
                                        <span className="font-extrabold text-[#006664] text-xl">฿{totalPrice}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-slate-100"></div>

                            {/* ส่วนที่ 4: วันและเวลา (Date/Time) */}
                            <div className={`flex items-center gap-4 py-4 transition-all duration-500 ${currentStep < 3 ? 'opacity-40' : 'opacity-100'}`}>
                                <div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/card:bg-[#006664]/5 group-hover/card:text-[#006664] transition-colors border border-slate-100/50">
                                    <Calendar size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">นัดหมายวันและเวลา</span>
                                    <div className="font-bold text-slate-800 truncate text-[15px] pr-2">
                                        {form?.date && currentStep >= 3 
                                            ? new Date(form.date).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) + ' น.' 
                                            : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* หมายเหตุ (Note) */}
                        {currentStep === 3 && form?.note && (
                            <div className="animate-in fade-in zoom-in duration-500">
                                <div className="bg-[#B2BB1E]/5 rounded-2xl p-4 border border-[#B2BB1E]/10 flex gap-3 items-start">
                                    <MessageSquareText size={16} className="text-[#006664] mt-1 shrink-0" />
                                    <p className="text-slate-600 text-[13px] leading-relaxed font-bold italic truncate">
                                        "{form.note}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ========================================================
                            ปุ่มกด (Call to Action)
                            ======================================================== */}
                        <div className="pt-4 flex flex-col gap-4">
                            {/* ปุ่มขั้นตอนถัดไป */}
                            {currentStep < 3 ? (
                                <button 
                                    onClick={onNext} 
                                    className="w-full bg-[#006664] hover:bg-[#005553] text-white py-4.5 rounded-[1.5rem] font-extrabold text-[17px] transition-all duration-300 shadow-[0_12px_25px_rgba(0,102,100,0.18)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 group"
                                >
                                    ขั้นตอนถัดไป 
                                    <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" strokeWidth={3} />
                                </button>
                            ) : (
                                /* ปุ่มยืนยันการจอง (ขั้นตอนสุดท้าย) */
                                <button 
                                    onClick={() => setShowConfirmModal(true)} 
                                    className="w-full bg-gradient-to-br from-[#006664] to-[#00807D] hover:from-[#005553] hover:to-[#00706E] text-white py-4.5 rounded-[1.5rem] font-extrabold text-[17px] transition-all duration-300 shadow-[0_15px_30px_rgba(0,102,100,0.25)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3"
                                >
                                    ยืนยันส่งข้อมูลจอง 
                                    <CheckCircle size={20} strokeWidth={3} />
                                </button>
                            )}

                            {/* ปุ่มย้อนกลับ */}
                            {currentStep > 1 && (
                                <button 
                                    onClick={onBack} 
                                    className="w-fit mx-auto text-slate-400 hover:text-slate-600 py-1 font-extrabold text-[13px] transition-all uppercase tracking-widest flex items-center gap-2 group/back"
                                >
                                    <ChevronLeft size={16} strokeWidth={2.5} className="transition-transform group-hover/back:-translate-x-1" /> 
                                    ย้อนกลับไปแก้ไข
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================
                2. ส่วนแสดงผลบนมือถือ (Mobile Bottom Bar)
                ======================================================== */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-100/50 px-6 py-5 pb-safe shadow-[0_-15px_40px_rgba(0,0,0,0.06)] z-40 animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center justify-between mb-5 px-1">
                    
                    {/* สรุปราคา */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#006664]/5 rounded-full flex items-center justify-center text-[#B2BB1E]">
                            <Wallet size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[16px] font-extrabold text-[#006664] leading-tight block">
                                ฿{totalPrice}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                                {selectedZones.length} บริการที่เลือก
                            </span>
                        </div>
                    </div>

                    {/* ตัวเลขบอกสถานะขั้นตอน */}
                    <div className="bg-[#006664]/5 text-[#006664] px-3 py-1.5 rounded-full text-[11px] font-extrabold border border-[#006664]/10">
                        ขั้นตอน {currentStep}/3
                    </div>
                </div>

                {/* ปุ่มกดเวอร์ชันมือถือ */}
                <div className="flex gap-3">
                    {/* ปุ่มย้อนกลับ (มีตั้งแต่ขั้นตอนที่ 2) */}
                    {currentStep > 1 && (
                        <button 
                            onClick={onBack} 
                            className="w-[4rem] bg-slate-50 active:bg-slate-100 text-slate-400 py-4 rounded-[1.25rem] font-extrabold flex items-center justify-center transition-all border border-slate-100 shadow-sm"
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                    )}

                    {/* ปุ่มถัดไป / ยืนยัน */}
                    {currentStep < 3 ? (
                        <button 
                            onClick={onNext} 
                            className="flex-1 bg-[#006664] active:bg-[#005553] text-white py-4 rounded-[1.25rem] font-extrabold text-[17px] shadow-[0_10px_20px_rgba(0,102,100,0.2)] flex items-center justify-center gap-2 transition-all active:scale-[0.96] active:translate-y-1"
                        >
                            ถัดไป 
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowConfirmModal(true)} 
                            className="flex-1 bg-gradient-to-r from-[#006664] to-[#00807D] active:from-[#005553] active:to-[#00706E] text-white py-4 rounded-[1.25rem] font-extrabold text-[17px] shadow-[0_12px_25px_rgba(0,102,100,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.96] active:translate-y-1"
                        >
                            ยืนยันการจอง
                        </button>
                    )}
                </div>
            </div>

            {/* ===== ป๊อปอัปยืนยันการจอง ===== */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowConfirmModal(false)}>
                    <div className="bg-white rounded-[1.75rem] shadow-2xl max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
                        
                        {/* ส่วนหัว */}
                        <div className="pt-8 pb-4 text-center">
                            <div className="w-16 h-16 bg-[#006664]/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-[#006664]/20">
                                <CheckCircle size={30} className="text-[#006664]" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-2">ยืนยันส่งข้อมูลจอง</h3>
                             <p className="text-[13px] text-slate-500 font-medium px-6 leading-relaxed">
                                กรุณาตรวจสอบข้อมูลการจองให้ถูกต้องก่อนยืนยัน
                             </p>
                        </div>


                        {/* ปุ่มยกเลิก / ยืนยัน */}
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
                            >
                                กลับไปแก้ไข
                            </button>
                            <button
                                onClick={() => { 
                                    setShowConfirmModal(false); 
                                    submitBooking(); 
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-[#006664] hover:bg-[#005553] transition-colors active:scale-95 shadow-md shadow-[#006664]/20"
                            >
                                ยืนยันข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BookingSummary;