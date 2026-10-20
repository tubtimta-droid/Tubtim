import React from 'react';
import { Info, Calendar, Phone, MessageSquareText, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

const BookingStepDetails = ({
    form,
    setForm,
    errors,
    setErrors,
    getMinDateTime,
    buildLocationString,
    selectedZones,
    serviceZones
}) => {
    return (
        <section className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-5 pl-1">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">วันเวลา และรายละเอียด</h2>
            </div>

            <div className="space-y-6">
                {/* สรุปสถานที่และบริการที่เลือก */}
                <div className="bg-gradient-to-br from-[#006664]/5 to-[#006664]/10 p-5 sm:p-6 rounded-2xl border border-[#006664]/10 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-white flex items-center justify-center">
                            <CheckCircle2 size={18} className="text-[#006664]" />
                        </div>
                        <span className="text-[17px] font-bold text-[#006664]">สรุปที่เลือกไว้</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <span className="bg-white border border-[#006664]/20 text-[#006664] px-3.5 py-2 rounded-full text-[14px] font-bold shadow-sm flex items-center gap-2">
                            <MapPin size={15} className="text-[#006664]/60" />
                            {buildLocationString()}
                        </span>
                        {selectedZones.map((zId) => {
                            const z = serviceZones.find((zone) => zone.id === zId);
                            return z ? (
                                <span
                                    key={zId}
                                    className="bg-white border border-[#006664]/20 text-[#006664] px-3.5 py-2 rounded-full text-[14px] font-bold shadow-sm flex items-center gap-2"
                                >
                                    {z.icon && <z.icon size={15} className="text-[#006664]/60" />}
                                    {z.label}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>

                {/* วันและเวลา */}
                <div id="field-date" className="space-y-2 w-full">
                    <label className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
                        ระบุวันและเวลา{' '}
                        <span className="text-[13px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded flex items-center gap-1.5 border border-amber-200">
                            <Info size={16} /> จองล่วงหน้าอย่างน้อย 3 ชม.
                        </span>
                    </label>
                    <div className="relative w-full">
                        <Calendar
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <input
                            type="datetime-local"
                            min={getMinDateTime()}
                            className={`block w-full appearance-none pl-12 pr-4 py-4 bg-white border-2 rounded-xl outline-none text-slate-800 font-bold text-[15px] sm:text-base transition-all shadow-sm ${errors.date ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50' : 'border-slate-200 focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/5'}`}
                            onChange={(e) => {
                                setForm({ ...form, date: e.target.value });
                                setErrors({ ...errors, date: '' });
                            }}
                            value={form.date}
                        />
                    </div>
                    {errors.date && (
                        <p className="text-[14px] text-red-500 font-bold flex items-center gap-1.5 mt-1.5">
                            <AlertCircle size={16} /> {errors.date}
                        </p>
                    )}
                </div>

                {/* เบอร์โทรศัพท์ */}
                <div id="field-phone" className="space-y-2 w-full">
                    <label className="text-[15px] font-bold text-slate-700 block">เบอร์ติดต่อกลับ</label>
                    <div className="relative w-full">
                        <Phone
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={20}
                        />
                        <input
                            type="tel"
                            placeholder="08XXXXXXXX"
                            value={form.phone}
                            className={`block w-full appearance-none pl-12 pr-4 py-4 bg-white border-2 rounded-xl outline-none text-slate-800 font-bold text-[15px] sm:text-base transition-all shadow-sm ${errors.phone ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50' : 'border-slate-200 focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/5'}`}
                            maxLength={10}
                            onChange={(e) => {
                                setForm({
                                    ...form,
                                    phone: e.target.value.replace(/\\D/g, ''),
                                });
                                setErrors({ ...errors, phone: '' });
                            }}
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-[14px] text-red-500 font-bold flex items-center gap-1.5 mt-1.5">
                            <AlertCircle size={16} /> {errors.phone}
                        </p>
                    )}
                </div>

                {/* หมายเหตุถึงแม่บ้าน */}
                <div className="space-y-2 w-full mt-6">
                    <div className="flex items-center justify-between">
                        <label className="text-[15px] font-bold text-slate-700 flex items-center gap-2">
                            หมายเหตุถึงแม่บ้าน (ถ้ามี)
                        </label>
                        <span className="text-[13px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-md">
                            ไม่บังคับ
                        </span>
                    </div>
                    <div className="relative w-full">
                        <MessageSquareText className="absolute left-4 top-4 text-slate-400" size={20} />
                        <textarea
                            placeholder="เช่น กุญแจอยู่ใต้พรม, โทรแจ้งเมื่อถึงหอพัก..."
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            className="block w-full appearance-none pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl outline-none text-slate-800 font-medium text-[15px] transition-all focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/5 shadow-sm resize-none leading-relaxed"
                            rows={3}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingStepDetails;
