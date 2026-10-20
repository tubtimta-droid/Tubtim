import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, MapPin, Check, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const BookingStepLocation = ({
    dormBuildings,
    selectedBuilding,
    setSelectedBuilding,
    selectedRoom,
    setSelectedRoom,
    rooms,
    errors,
    setErrors,
    isLoaded,
    mapPin,
    setMapPin,
    defaultCenter
}) => {
    // ปุ่มขยายแผนที่แบบเขียนเอง: ปุ่มเต็มจอของ Google ไม่แสดงบน iPhone (iOS ไม่รองรับ Fullscreen API กับแผนที่)
    // จึงขยายด้วย CSS (fixed เต็มหน้าจอ) ซึ่งใช้ได้ทุกอุปกรณ์
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const mapRef = useRef(null);
    useLockBodyScroll(isMapExpanded);

    useEffect(() => {
        // บอกแผนที่ว่ากรอบเปลี่ยนขนาดแล้ว และจัดกึ่งกลางที่หมุดอีกครั้ง
        const t = setTimeout(() => {
            if (mapRef.current && window.google) {
                window.google.maps.event.trigger(mapRef.current, 'resize');
                mapRef.current.setCenter(mapPin || defaultCenter);
            }
        }, 80);
        return () => clearTimeout(t);
    }, [isMapExpanded]);

    return (
        <section className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div id="field-building">
                <div className="flex items-center gap-3 mb-5 pl-1">
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">1. เลือกหอพัก</h2>
                </div>

                {/* หอพักนิสิต */}
                <div className="flex items-center gap-2.5 mb-3 pl-1">
                    <div className="w-1.5 h-5 bg-[#006664] rounded-full"></div>
                    <p className="text-base font-bold text-slate-600">หอพักนิสิต</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    {dormBuildings.filter((d) => d.dormType === 'student').map((dorm) => {
                        const isSelected = selectedBuilding?.id === dorm.id;
                        return (
                            <button
                                key={dorm.id}
                                onClick={() => {
                                    setSelectedBuilding(dorm);
                                    if (dorm.lat && dorm.lng) {
                                        setMapPin({ lat: dorm.lat, lng: dorm.lng });
                                    }
                                }}
                                className={`relative p-4 sm:p-5 rounded-[1.25rem] border-2 text-left transition-all duration-300 ${isSelected ? 'border-[#006664] bg-gradient-to-br from-[#006664]/5 to-[#006664]/10 shadow-md scale-[1.02]' : 'border-slate-200 bg-white hover:border-[#006664]/40 hover:shadow-sm'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div>
                                        <div
                                            className={`text-base font-bold tracking-wide ${isSelected ? 'text-[#006664]' : 'text-slate-700'}`}
                                        >
                                            {dorm.label}
                                        </div>
                                        <div className="text-[12px] text-slate-400 font-medium">
                                            {new Set(dorm.rooms.map((r) => r.floor)).size} ชั้น • {dorm.rooms.length} ห้อง
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute right-3 top-3 w-6 h-6 bg-[#006664] rounded-full flex items-center justify-center shadow-sm">
                                        <Check size={14} className="text-white" strokeWidth={3.5} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* อาคารที่พักบุคลากร */}
                <div className="flex items-center gap-2.5 mb-3 pl-1">
                    <div className="w-1.5 h-5 bg-[#B2BB1E] rounded-full"></div>
                    <p className="text-base font-bold text-slate-600">อาคารบุคลากร</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {dormBuildings.filter((d) => d.dormType === 'staff').map((dorm) => {
                        const isSelected = selectedBuilding?.id === dorm.id;
                        return (
                            <button
                                key={dorm.id}
                                onClick={() => {
                                    setSelectedBuilding(dorm);
                                    if (dorm.lat && dorm.lng) {
                                        setMapPin({ lat: dorm.lat, lng: dorm.lng });
                                    }
                                }}
                                className={`relative p-4 sm:p-5 rounded-[1.25rem] border-2 text-left transition-all duration-300 ${isSelected ? 'border-[#006664] bg-gradient-to-br from-[#006664]/5 to-[#006664]/10 shadow-md scale-[1.02]' : 'border-slate-200 bg-white hover:border-[#006664]/40 hover:shadow-sm'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div>
                                        <div
                                            className={`text-base font-bold tracking-wide ${isSelected ? 'text-[#006664]' : 'text-slate-700'}`}
                                        >
                                            {dorm.label}
                                        </div>
                                        <div className="text-[12px] text-slate-400 font-medium">
                                            {new Set(dorm.rooms.map((r) => r.floor)).size} ชั้น • {dorm.rooms.length} ห้อง
                                        </div>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute right-3 top-3 w-6 h-6 bg-[#006664] rounded-full flex items-center justify-center shadow-sm">
                                        <Check size={14} className="text-white" strokeWidth={3.5} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {errors.building && (
                    <p className="text-sm text-red-500 font-bold flex items-center gap-1 mt-2 pl-2">
                        <AlertCircle size={16} /> {errors.building}
                    </p>
                )}
            </div>

            {/* ช่องเลือกเลขห้อง */}
            {selectedBuilding && (
                <div id="field-room" className="mt-8 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-3 pl-1">
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">2. เลือกห้อง</h2>
                        <span className="text-sm font-bold text-[#006664] bg-[#006664]/5 px-3 py-1 rounded-full border border-[#006664]/10">
                            {selectedBuilding.label}
                        </span>
                    </div>
                    <div className="relative w-full max-w-lg mb-6">
                        <Building2
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <select
                            value={selectedRoom}
                            onChange={(e) => {
                                setSelectedRoom(e.target.value);
                                setErrors((prev) => ({ ...prev, room: '' }));
                            }}
                            className={`block w-full appearance-none pl-12 pr-10 py-4 bg-white border-2 rounded-xl outline-none text-slate-800 font-bold text-[15px] sm:text-base transition-all shadow-sm cursor-pointer ${errors.room ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50' : 'border-slate-200 focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/5'}`}
                        >
                            <option value="">— กรุณาเลือกห้อง —</option>
                            {[...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b).map((floor) => (
                                <optgroup key={floor} label={`ชั้น ${floor}`}>
                                    {rooms
                                        .filter((r) => r.floor === floor)
                                        .map((r) => (
                                            <option key={r.room} value={r.room}>
                                                {r.label}
                                            </option>
                                        ))}
                                </optgroup>
                            ))}
                        </select>
                        <ChevronDown
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                            size={20}
                        />
                    </div>
                    {errors.room && (
                        <p className="text-sm text-red-500 font-bold flex items-center gap-1 mt-2 pl-2">
                            <AlertCircle size={16} /> {errors.room}
                        </p>
                    )}

                    {/* แผนที่สำหรับปักหมุดตำแหน่ง */}
                    {selectedRoom && (
                        <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 pl-1">
                                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                                    3. ปักหมุดตำแหน่งบนแผนที่
                                    <MapPin className="text-[#006664]" size={24} /> 
                                </h2>
                            </div>
                            <div className={isMapExpanded
                                ? "fixed inset-0 z-[9999] w-full h-full bg-white overflow-hidden group/map"
                                : "w-full h-[20rem] sm:h-[24rem] rounded-[1.5rem] overflow-hidden border-2 border-slate-200/80 shadow-sm relative group/map"}>
                                {!isLoaded ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-[#006664] font-bold text-base animate-pulse">
                                        กำลังโหลดแผนที่...
                                    </div>
                                ) : (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={mapPin || defaultCenter}
                                        zoom={16}
                                        onLoad={(map) => { mapRef.current = map; }}
                                        onUnmount={() => { mapRef.current = null; }}
                                        onClick={(e) => {
                                            if (e.latLng)
                                                setMapPin({
                                                    lat: e.latLng.lat(),
                                                    lng: e.latLng.lng(),
                                                });
                                        }}
                                        options={{
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            streetViewControl: false,
                                            mapTypeControl: false,
                                            fullscreenControl: false,
                                        }}
                                    >
                                        {mapPin && (
                                            <MarkerF
                                                position={mapPin}
                                                animation={window.google.maps.Animation.DROP}
                                            />
                                        )}
                                    </GoogleMap>
                                )}
                                {isLoaded && (
                                    <button
                                        type="button"
                                        onClick={() => setIsMapExpanded((v) => !v)}
                                        aria-label={isMapExpanded ? 'ย่อแผนที่' : 'ขยายแผนที่'}
                                        className="absolute top-3 right-3 z-10 w-10 h-10 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center text-slate-600 hover:text-[#006664] active:scale-95 transition-all"
                                    >
                                        {isMapExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                    </button>
                                )}
                                {isMapExpanded && (
                                    <button
                                        type="button"
                                        onClick={() => setIsMapExpanded(false)}
                                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-8 py-3.5 bg-[#006664] text-white rounded-full font-bold text-[15px] shadow-[0_10px_25px_rgba(0,102,100,0.35)] active:scale-95 transition-all"
                                    >
                                        {mapPin ? 'ยืนยันตำแหน่งนี้' : 'ปิดแผนที่'}
                                    </button>
                                )}
                                {!mapPin && isLoaded && (
                                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.1)] text-[15px] font-bold text-[#006664] border border-[#006664]/20 pointer-events-none flex items-center gap-2.5 transition-all duration-300 group-hover/map:-translate-y-1">
                                        <span className="relative flex h-3.5 w-3.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B2BB1E] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#B2BB1E]"></span>
                                        </span>
                                        แตะบริเวณที่พักของคุณบนแผนที่
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default BookingStepLocation;