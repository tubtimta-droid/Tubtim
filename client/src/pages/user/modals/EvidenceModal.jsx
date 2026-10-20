import React, { useState, useEffect } from 'react';
import { Camera, X, Image as ImageIcon, ZoomIn, MapPin } from 'lucide-react';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const EvidenceModal = ({ isOpen, onClose, jobPhotos }) => {
    useLockBodyScroll(isOpen);
    // แท็บรูปที่เลือก: before (ก่อนทำ) / after (หลังทำ)
    const [photoTab, setPhotoTab] = useState('before');
    // ✨ เพิ่ม State สำหรับเก็บรูปที่จะขยายเต็มจอ
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);

    // ดึงรายชื่อโซนทั้งหมดที่มีรูป
    const availableZones = Array.from(new Set((jobPhotos || []).map((p) => p.service_zone).filter(Boolean)));

    // เปิดป๊อปอัปครั้งแรก → เลือกโซนแรกที่มีรูปให้อัตโนมัติ
    useEffect(() => {
        if (isOpen && availableZones.length > 0 && !selectedZone) {
            setSelectedZone(availableZones[0]);
        }
    }, [isOpen, availableZones, selectedZone]);

    // แปลงรหัสโซนเป็นชื่อภาษาไทย
    const getZoneLabel = (zoneId) => {
        try {
            let key = zoneId;
            if (typeof zoneId === 'string' && (zoneId.startsWith('"') || zoneId.startsWith('['))) {
                 const parsed = JSON.parse(zoneId);
                 if(Array.isArray(parsed)) key = parsed[0];
                 else key = parsed;
            }
            return key;
        } catch {
            return zoneId;
        }
    };

    // จัดการล็อคหน้าจอพื้นหลัง
    useEffect(() => {
        if (isOpen || fullscreenImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, fullscreenImage]);

    if (!isOpen) return null;

    return (
        <>
            {/* ==================== 1. Modal หลัก ==================== */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 md:p-8 relative z-10 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col border border-slate-100">
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div>
                            <h3 className="text-xl font-bold text-[#006664] flex items-center gap-2"><Camera size={20}/> ผลงาน</h3>
                            <p className="text-xs text-slate-500 mt-1 font-bold">ภาพเปรียบเทียบก่อนและหลังทำงาน</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition"><X size={18}/></button>
                    </div>

                    {availableZones.length > 0 && (
                        <div className="mb-4 overflow-x-auto custom-scrollbar pb-2">
                            <div className="flex gap-2 w-max">
                                {availableZones.map((zId, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setSelectedZone(zId)}
                                        className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border ${
                                            selectedZone === zId 
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            {getZoneLabel(zId)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-xl shrink-0">
                        <button onClick={() => setPhotoTab('before')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${photoTab === 'before' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ก่อนทำ (Before)</button>
                        <button onClick={() => setPhotoTab('after')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${photoTab === 'after' ? 'bg-white text-[#006664] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>หลังทำ (After)</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            {jobPhotos.filter((p) => p.photo_type === photoTab && (!selectedZone || p.service_zone === selectedZone)).length > 0 ? (
                                jobPhotos.filter((p) => p.photo_type === photoTab && (!selectedZone || p.service_zone === selectedZone)).map((p) => (
                                    <div 
                                        key={p.photo_id}
                                        className="relative rounded-2xl overflow-hidden aspect-square border-2 border-slate-100 bg-slate-50 group cursor-pointer"
                                        onClick={() => setFullscreenImage(p.photo_path)} // ✨ กดเพื่อเซ็ตค่ารูปที่จะขยาย
                                    >
                                        <img src={`/backend-images${p.photo_path}`} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="Job Evidence"/>
                                        
                                        {/* ✨ Layer ดำๆ และไอคอนแว่นขยายที่จะโผล่มาตอน Hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                            <div className="bg-white/90 backdrop-blur-sm text-slate-700 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                                                <ZoomIn size={20} className="text-slate-700" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 py-12 text-center text-slate-400 flex flex-col items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <ImageIcon size={36} strokeWidth={1.5} className="mb-3 opacity-30"/>
                                    <p className="text-sm font-bold">ไม่มีรูปภาพในหมวดนี้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== 2. Modal ขยายรูปเต็มจอ (Lightbox) ==================== */}
            {fullscreenImage && (
                <div 
                    className="fixed inset-0 z-[11000] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setFullscreenImage(null)} // ✨ กดพื้นที่สีดำเพื่อปิด
                >
                    {/* ปุ่มปิดมุมขวาบน */}
                    <button 
                        onClick={() => setFullscreenImage(null)} 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20 backdrop-blur-sm"
                    >
                        <X size={24} />
                    </button>

                    {/* รูปภาพขยายใหญ่ */}
                    <img 
                        src={`/backend-images${fullscreenImage}`} 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 relative z-10" 
                        alt="Evidence Fullscreen" 
                        onClick={e => e.stopPropagation()} // ✨ ป้องกันไม่ให้กดโดนรูปแล้วป๊อปอัปปิด
                    />
                </div>
            )}
        </>
    );
};

export default EvidenceModal;