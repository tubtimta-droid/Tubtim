import React from 'react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';

const BookingStepServices = ({
    serviceZones,
    selectedZones,
    expandedZoneId,
    setExpandedZoneId,
    dormType,
    selectedBuilding,
    MAX_ZONES,
    isMaxReached,
    toggleZone,
    getPrice

}) => {
    return (
        <section className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div id="field-zones">
                <div className="flex items-center gap-3 mb-2 pl-1">
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">
                        เลือกบริการทำความสะอาด
                    </h2>
                    <span
                        className={`text-[14px] font-bold px-3.5 py-1 rounded-full hidden sm:inline-block transition-colors duration-300 ${isMaxReached ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}
                    >
                        {selectedZones.length}/{MAX_ZONES} รายการ
                    </span>
                </div>


                <p className="text-sm text-slate-500 font-medium mb-3 pl-1">
                    ราคาสำหรับ: <span className="font-bold text-[#006664]">{selectedBuilding?.label}</span>{' '}
                    ({dormType === 'student' ? 'หอพักนิสิต' : 'อาคารบุคลากร'})
                </p>
                <p className="text-[13px] text-slate-400 font-medium mb-8 pl-1 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-slate-400" />
                    เลือกได้สูงสุด {MAX_ZONES} รายการต่อ 1 การจอง
                </p>

                {/* บริการหลัก (จัดการ์ดหลายคอลัมน์) */}
                <div className="columns-1 md:columns-2 gap-5 w-full">
                    {serviceZones
                        .filter((z) => !z.isAddon)
                        .map((zone) => {
                            const isSelected = selectedZones.includes(zone.id);
                            const isExpanded = expandedZoneId === zone.id;
                            const price = getPrice(zone);
                            const Icon = zone.icon;
                            const isDisabled = !isSelected && isMaxReached;

                            return (
                                <div
                                    key={zone.id}
                                    className={`break-inside-avoid mb-5 transition-opacity duration-300 ${isDisabled ? 'opacity-50' : ''}`}
                                >
                                    <div
                                        className={`rounded-[1.25rem] border-2 transition-all duration-300 overflow-hidden flex flex-col relative ${isSelected ? 'border-[#006664] bg-white shadow-[0_4px_15px_rgba(0,102,100,0.08)]' : isDisabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-[#006664]/40 hover:shadow-sm'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute right-3 top-3 w-6 h-6 bg-[#006664] rounded-full flex items-center justify-center shadow-sm z-10">
                                                <Check size={14} className="text-white" strokeWidth={3.5} />
                                            </div>
                                        )}
                                        {/* กดเลือก (Checkbox Area) */}
                                        <button
                                            onClick={() => toggleZone(zone.id)}
                                            disabled={isDisabled}
                                            className={`w-full text-left pt-6 px-5 sm:px-6 flex items-start gap-4 group focus:outline-none ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                        >


                                            <div
                                                className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-[#006664] text-white' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-[#006664]'}`}
                                            >
                                                <Icon size={26} strokeWidth={isSelected ? 2 : 1.5} />
                                            </div>

                                            <div className="flex-1 min-w-0 pb-1">
                                                <h3
                                                    className={`font-bold text-base sm:text-[17px] tracking-wide leading-snug transition-colors ${isSelected ? 'text-[#006664]' : 'text-slate-800 group-hover:text-[#006664]'}`}
                                                >
                                                    {zone.label}
                                                </h3>
                                                <div className="flex flex-col items-start gap-2 mt-2.5">
                                                    <span className="inline-flex items-center text-[14px] font-extrabold text-[#B2BB1E] bg-[#B2BB1E]/15 px-3 py-1 rounded-md">
                                                        ฿{price}
                                                    </span>
                                                    {zone.warning && (
                                                        <span className="text-[12px] sm:text-[13px] text-red-500 font-bold leading-relaxed mt-1">
                                                            *{zone.warning}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        {/* ปุ่ม Toggle รายละเอียด */}
                                        {zone.details && zone.details.length > 0 && (
                                            <div className="px-5 pb-4 pt-3 flex justify-end w-full">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedZoneId(isExpanded ? null : zone.id);
                                                    }}
                                                    className={`text-[13px] sm:text-[14px] font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors focus:outline-none ${isExpanded ? 'bg-[#006664]/5 text-[#006664]' : 'text-slate-500 hover:text-[#006664] hover:bg-slate-50'}`}
                                                >
                                                    {isExpanded ? 'ปิดรายละเอียด' : 'ดูรายละเอียดงาน'}
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#006664]' : 'text-slate-400'}`}
                                                    />
                                                </button>
                                            </div>
                                        )}

                                        {/* พื้นที่แสดงรายละเอียด */}
                                        <div
                                            className={`w-full bg-[#f8fafc] transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[600px] border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}
                                        >
                                            <div className="p-5 sm:p-6">
                                                <ul className="space-y-3">
                                                    {zone.details.map((detail, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-3 text-[13px] sm:text-[14px] text-[#006664]/90 font-medium leading-relaxed"
                                                        >
                                                            <div className="w-2 h-2 rounded-full bg-[#B2BB1E] shrink-0 mt-[6px] shadow-sm"></div>
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* บริการเสริม */}
                <div className="flex items-center gap-2 mb-5 pl-1 mt-6">
                    <h3 className="text-[19px] sm:text-xl font-extrabold text-slate-800">
                        บริการเสริม
                    </h3>
                </div>

                <div className="columns-1 md:columns-2 gap-5 w-full">
                    {serviceZones
                        .filter((z) => z.isAddon)
                        .map((zone) => {
                            const isSelected = selectedZones.includes(zone.id);
                            const isExpanded = expandedZoneId === zone.id;
                            const price = getPrice(zone);
                            const Icon = zone.icon;
                            const isDisabled = !isSelected && isMaxReached;

                            return (
                                <div
                                    key={zone.id}
                                    className={`break-inside-avoid mb-5 transition-opacity duration-300 ${isDisabled ? 'opacity-50' : ''}`}
                                >
                                    <div
                                        className={`rounded-[1.25rem] border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col relative ${isSelected ? 'border-[#006664] bg-[#006664]/[0.02] shadow-sm border-solid' : isDisabled ? 'border-slate-200 bg-slate-100 cursor-not-allowed' : 'border-slate-200 bg-slate-50 hover:border-[#006664]/40'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute right-3 top-3 w-6 h-6 bg-[#006664] rounded-full flex items-center justify-center shadow-sm z-10">
                                                <Check size={14} className="text-white" strokeWidth={3.5} />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => toggleZone(zone.id)}
                                            disabled={isDisabled}
                                            className={`w-full text-left pt-5 px-4 sm:px-5 flex items-start gap-3.5 group focus:outline-none ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                        >


                                            <div
                                                className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-[#006664] text-white' : 'bg-white border border-slate-200 text-slate-400 group-hover:border-[#006664]/30 group-hover:text-[#006664]'}`}
                                            >
                                                <Icon size={20} strokeWidth={isSelected ? 2 : 1.5} />
                                            </div>

                                            <div className="flex-1 min-w-0 pb-1">
                                                <h3
                                                    className={`font-bold text-[14px] sm:text-[15px] tracking-wide leading-snug transition-colors ${isSelected ? 'text-[#006664]' : 'text-slate-700 group-hover:text-[#006664]'}`}
                                                >
                                                    {zone.label}
                                                </h3>
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center text-[13px] font-extrabold text-[#B2BB1E] bg-[#B2BB1E]/15 px-2.5 py-0.5 rounded-md">
                                                        ฿{price}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>

                                        {zone.details && zone.details.length > 0 && (
                                            <div className="px-4 pb-3 pt-2 flex justify-end w-full">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedZoneId(isExpanded ? null : zone.id);
                                                    }}
                                                    className={`text-[12px] sm:text-[13px] font-bold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none ${isExpanded ? 'bg-[#006664]/5 text-[#006664]' : 'text-slate-500 hover:text-[#006664] hover:bg-slate-100'}`}
                                                >
                                                    {isExpanded ? 'ปิดรายละเอียด' : 'ดูรายละเอียด'}
                                                    <ChevronDown
                                                        size={14}
                                                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#006664]' : 'text-slate-400'}`}
                                                    />
                                                </button>
                                            </div>
                                        )}

                                        <div
                                            className={`w-full bg-white transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0 border-transparent'}`}
                                        >
                                            <div className="p-4 sm:p-5">
                                                <ul className="space-y-2.5">
                                                    {zone.details.map((detail, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-2.5 text-[12px] sm:text-[13px] text-[#006664]/90 font-medium leading-relaxed"
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#B2BB1E] shrink-0 mt-[6px]"></div>
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>


            </div>
        </section>
    );
};

export default BookingStepServices;
