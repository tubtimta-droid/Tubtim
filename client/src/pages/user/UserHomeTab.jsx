import { ArrowRight, Check } from 'lucide-react';
import { SERVICE_ZONE_META } from './bookingConstants';

const UserHomeTab = ({ goToBooking }) => {
    // ไอคอนและรายละเอียดงานมาจาก SERVICE_ZONE_META (ชุดเดียวกับหน้าจองและประวัติ)
    const SERVICES = [
        { id: 'bedroom', title: "ทำความสะอาดห้องนอน" },
        { id: 'bathroom', title: "ขัดล้างห้องน้ำ" },
        { id: 'balcony', title: "ทำความสะอาดระเบียง" },
        { id: 'kitchen', title: "ทำความสะอาดโซนครัว" },
        { id: 'fridge', title: "ล้างทำความสะอาดตู้เย็น" },
        { id: 'laundry', title: "ซักผ้า-ตากผ้า" },
        { id: 'ironing', title: "รีดผ้า" },
    ];

    return (
        <div className="w-full bg-[#fdfdfd] animate-in fade-in duration-1000">

            {/* =========================================================
                ✨ HERO SECTION (Modern Split Layout)
            ========================================================= */}
            {/* ส่วนหัวเต็มความกว้าง (รูปพื้นหลัง + ข้อความต้อนรับ) */}
            <div className="relative h-[650px] lg:h-[800px] w-full overflow-hidden group">

                {/* รูปพื้นหลังเต็มความกว้าง */}
                <div className="absolute inset-0 z-0 scale-105 group-hover:scale-100 transition-transform duration-[3000ms]">
                    <img
                        src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2500&auto=format&fit=crop"
                        alt="Clean Interior"
                        className="w-full h-full object-cover"
                    />
                    {/* ชั้นสีทับรูป ให้อ่านข้อความได้ชัด */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10 hidden lg:block w-3/4"></div>
                    <div className="absolute inset-0 bg-white/70 z-10 lg:hidden"></div>

                    {/* ไล่สีขอบล่างให้กลืนกับพื้นหลัง */}
                    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-15"></div>
                </div>

                {/* ชั้นเนื้อหา (จัดกึ่งกลาง ความกว้างเท่าส่วนอื่นของหน้า) */}
                <div className="relative z-20 h-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-center">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center px-4 py-2 bg-[#006664]/[0.08] border border-[#006664]/10 rounded-full text-[#006664] text-xs font-bold tracking-wider uppercase mb-8 w-fit backdrop-blur-md">
                            Cleaning Service
                        </div>

                        <h1 className="text-slate-900 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-normal mb-8 leading-[1.15]">
                            <span className="text-[#006664]">มั่นใจ</span>กับความสะอาด <br />
                            ระดับ<span className="relative inline-block">
                                คุณภาพ
                                <div className="absolute bottom-1.5 left-0 w-full h-3 bg-[#B2BB1E]/30 -z-10 rotate-1"></div>
                            </span>
                        </h1>

                        <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed mb-12 max-w-xl">
                            สัมผัสประสบการณ์รับบริการทำความสะอาดที่ "เรียบง่าย รวดเร็ว และไว้ใจได้" ให้คุณมีเวลาไปทำสิ่งที่สำคัญกว่า
                        </p>

                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <button
                                onClick={goToBooking}
                                className="bg-[#006664] text-white px-12 py-5 rounded-2xl font-bold text-xl tracking-wide hover:bg-[#004d4b] transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(0,102,100,0.35)] hover:shadow-[0_25px_50px_-12px_rgba(0,102,100,0.45)] hover:-translate-y-1 flex items-center gap-4 active:scale-95 w-fit justify-center"
                            >
                                จองบริการตอนนี้
                                <ArrowRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================
                ✨ SERVICES SECTION (Soft UI Grid)
            ========================================================= */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-40">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 lg:mb-24">
                    <div className="max-w-2xl px-6 sm:px-0">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-normal">
                            บริการที่ตอบโจทย์ <br />
                            <span className="text-[#006664]">ทุกไลฟ์สไตล์</span>การใช้ชีวิต
                        </h2>
                        <p className="text-slate-500 font-medium text-lg">
                            เราคัดสรรบริการที่หลากหลายเพื่อให้คุณได้พักผ่อนอย่างเต็มที่ในพื้นที่ที่สะอาดหมดจด
                        </p>
                    </div>
                </div>

                {/* การ์ดข้อมูลบริการ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                    {SERVICES.map((s) => {
                        const meta = SERVICE_ZONE_META[s.id];
                        const Icon = meta?.icon;
                        return (
                            <div
                                key={s.id}
                                className="p-7 md:p-8 rounded-[2rem] bg-white border border-slate-100 flex flex-col"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#006664]/[0.07] flex items-center justify-center text-[#006664]">
                                        {Icon && <Icon size={24} strokeWidth={2} />}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 tracking-normal leading-snug">{s.title}</h3>
                                </div>

                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                                    สิ่งที่รวมอยู่ในบริการ
                                </p>
                                <ul className="space-y-2.5">
                                    {meta?.details?.map((d) => (
                                        <li key={d} className="flex items-start gap-3 text-[15px] text-slate-600 font-medium leading-snug">
                                            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[#006664]/10 text-[#006664] flex items-center justify-center">
                                                <Check size={12} strokeWidth={3} />
                                            </span>
                                            {d}
                                        </li>
                                    ))}
                                </ul>

                            </div>
                        );
                    })}
                </div>
            </div>



        </div>
    );
};

export default UserHomeTab;