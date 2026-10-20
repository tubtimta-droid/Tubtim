import React, { useState, useEffect } from 'react';
import { LogOut, User, ChevronDown, LayoutDashboard, CalendarPlus, History } from 'lucide-react';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const Navbar = ({ user, onLogout, onProfileClick, currentView, onViewChange }) => {
    // state: เปิดเมนูมือถืออยู่ไหม / เลื่อนหน้าลงมาแล้วไหม (ให้แถบเมนูหดลง) / แสดงป๊อปอัปออกจากระบบไหม
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // ติดตามการเลื่อนหน้า: เลื่อนลงเกิน 30px ให้แถบเมนูหดเล็กลงและมีเงา
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 30);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // รูปโปรไฟล์: ถ้าเป็นลิงก์ภายนอก (รูปจาก Google) ใช้ตรง ๆ ถ้าเป็นรูปที่อัปโหลดเองให้ดึงผ่าน /backend-images
    const profilePicUrl = user?.profile_pic
        ? (user.profile_pic.startsWith('http') ? user.profile_pic : `/backend-images${user.profile_pic}`)
        : null;

    // ลูกค้าและแอดมินกดเข้าหน้าโปรไฟล์ได้ และแสดงแค่ชื่อแรกของผู้ใช้
    const canViewProfile = user?.role === 'user' || user?.role === 'admin';
    const firstName = user?.fullname ? user.fullname.split(' ')[0] : 'ผู้ใช้งาน';

    // เปลี่ยนหน้าแล้วปิดเมนูมือถือ
    const handleNav = (view) => {
        onViewChange(view);
        setIsMobileMenuOpen(false);
    };

    // ล็อคหน้าจอพื้นหลังเมื่อเปิดเมนูมือถือ หรือป็อปอัพยืนยันออกจากระบบ
    useLockBodyScroll(isMobileMenuOpen);
    useLockBodyScroll(showLogoutConfirm);

    return (
        <>
            {/* ✨ ส่วนนี้คือหัวใจสำคัญ: 
              เรารวม "แถบสีเขียว" และ "แถบสีขาว" ไว้ในกล่องเดียวกัน 
              และตรึงไว้บนสุด (sticky top-0 z-50) เพื่อให้เป็นเนื้อเดียวกันตลอดเวลา 
            */}
            {/* 1. แถบข้อมูลด้านบนสุด (สีเขียว) — บนมือถือจัดเป็นแถวเดียวเหมือนบนคอม */}
            <div className="bg-[#006664] w-full flex items-center justify-center md:justify-end px-3 md:px-12 py-1.5 md:py-2 text-white/90 text-[7px] xs:text-[7.5px] sm:text-[9px] md:text-[11px] font-extrabold tracking-[0.05em] uppercase z-10 relative whitespace-nowrap overflow-hidden">
                <div className="flex items-center gap-1.5 xs:gap-2 md:gap-3">
                    <span className="opacity-100">KUCSC Internal Service</span>
                    <div className="w-1 h-1 rounded-full bg-[#B2BB1E]/80 shrink-0"></div>
                    <span className="opacity-80">มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติฯ</span>
                </div>
            </div>

            {/* แถบเมนูหลักที่ติดอยู่ด้านบนเสมอเมื่อเลื่อนหน้า (sticky) */}
            <div className="sticky top-0 z-50 w-full">

                {/* 2. แถบเมนูหลัก (พื้นหลังโปร่งแสงแบบกระจกฝ้า) */}
                <header
                    className={`w-full transition-all duration-500 border-b border-slate-200/50 backdrop-blur-xl ${isScrolled ? 'h-14 md:h-16 bg-white/95 shadow-sm' : 'h-16 md:h-24 bg-white/80'
                        }`}
                >
                    <div className="max-w-7xl mx-auto h-full px-5 sm:px-8 lg:px-12 flex items-center justify-between">

                        {/* โลโก้ KUCSC CLEAN (กดแล้วกลับหน้าแรก, ย่อขนาดบนมือถือ) */}
                        <button
                            onClick={() => handleNav('home')}
                            className="flex items-center text-left group transition-all active:scale-95 cursor-pointer outline-none relative"
                        >
                            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-normal flex items-center gap-1.5">
                                <span className="text-[#006664]">KUCSC</span>
                                <span className="text-[#B2BB1E]">CLEAN</span>
                            </h1>
                            <div className="absolute -bottom-1 left-0 w-0 h-1 bg-[#006664] rounded-full group-hover:w-full transition-all duration-500 hidden md:block"></div>
                        </button>

                        {/* เมนูตรงกลาง: หน้าแรก / จองบริการ / ประวัติการจอง (เฉพาะลูกค้า บนจอใหญ่) */}
                        {(user?.role === 'user') && (
                            <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
                                {[
                                    { id: 'home', label: 'หน้าแรก' },
                                    { id: 'booking', label: 'จองบริการ' },
                                    { id: 'history', label: 'ประวัติการจอง' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNav(item.id)}
                                        className={`relative py-2 text-[15px] font-bold tracking-normal transition-all duration-300 outline-none group ${currentView === item.id
                                                ? 'text-[#006664]'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                    >
                                        <span>{item.label}</span>
                                        {/* เส้นใต้เมนูที่เลือกอยู่ (มีแอนิเมชัน) */}
                                        <span className={`absolute bottom-0 left-0 h-[3px] bg-[#006664] rounded-full transition-all duration-500 ${currentView === item.id ? 'w-full' : 'w-0 group-hover:w-full group-hover:opacity-30'
                                            }`}></span>
                                    </button>
                                ))}
                            </nav>
                        )}

                        {/* ด้านขวา: โปรไฟล์และปุ่มต่าง ๆ */}
                        <div className="flex items-center gap-2 md:gap-4">

                            {/* โปรไฟล์และปุ่มออกจากระบบ (จอใหญ่) */}
                            <div className="hidden md:flex items-center gap-3">
                                <button
                                    onClick={canViewProfile ? onProfileClick : undefined}
                                    disabled={!canViewProfile}
                                    className={`flex items-center gap-3 p-1 pl-1 pr-4 rounded-full transition-all duration-300 border border-transparent ${canViewProfile ? 'hover:bg-white hover:shadow-md hover:border-slate-100 cursor-pointer active:scale-95' : 'cursor-default'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-100 group-hover:border-[#006664]/20 transition-colors">
                                        {profilePicUrl ? (
                                            <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="bg-[#006664]/5 w-full h-full flex items-center justify-center text-[#006664]">
                                                <User size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <div className="text-[13px] font-extrabold text-slate-800 leading-none mb-0.5">คุณ{firstName}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">บัญชีผู้ใช้งาน</div>
                                    </div>
                                    {canViewProfile && <ChevronDown size={14} className="text-slate-400 group-hover:text-[#006664] transition-colors" />}
                                </button>

                                <div className="w-px h-8 bg-slate-200 opacity-50"></div>

                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 hover:rotate-12"
                                    title="ออกจากระบบ"
                                >
                                    <LogOut size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* มือถือ (ไม่ใช่ผู้ใช้ทั่วไป เช่นแอดมิน): ไม่มีเมนูแฮมเบอร์เกอร์ จึงโชว์ปุ่มโปรไฟล์และออกจากระบบตรงๆ */}
                            {user?.role !== 'user' && (
                                <div className="md:hidden flex items-center gap-1.5">
                                    {canViewProfile && (
                                        <button
                                            onClick={onProfileClick}
                                            className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-slate-100 active:scale-95 transition-all"
                                            aria-label="โปรไฟล์"
                                        >
                                            {profilePicUrl ? (
                                                <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                                <div className="bg-[#006664]/5 w-full h-full flex items-center justify-center text-[#006664]">
                                                    <User size={18} />
                                                </div>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                                        aria-label="ออกจากระบบ"
                                    >
                                        <LogOut size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}

                            {/* ปุ่มเปิด/ปิดเมนูบนมือถือ (ไอคอนสามขีด) */}
                        {(user?.role === 'user') && (
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className={`md:hidden relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 z-50 ${isMobileMenuOpen ? 'bg-[#006664] shadow-lg shadow-[#006664]/30' : 'bg-slate-50 border border-slate-100'
                                        }`}
                                    aria-label="Toggle menu"
                                >
                                    <div className="relative w-[20px] h-[14px]">
                                        <span className={`absolute left-0 right-0 h-[2.2px] rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'top-[6px] rotate-45 bg-white' : 'top-0 bg-[#006664]'}`}></span>
                                        <span className={`absolute left-0 right-0 top-[6px] h-[2.2px] rounded-full transition-all duration-200 ease-in-out ${isMobileMenuOpen ? 'opacity-0 scale-x-0 bg-white' : 'opacity-100 scale-x-100 bg-[#006664]'}`}></span>
                                        <span className={`absolute left-0 right-0 h-[2.2px] rounded-full transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'top-[6px] -rotate-45 bg-white' : 'top-[12px] bg-[#006664]'}`}></span>
                                    </div>
                                </button>
                            )}
                        </div>

                    </div>
                </header>

                {/* ✨ ลิ้นชักเมนูมือถือ (Slide-down Menu)
                  ตำแหน่งจะเริ่มจากขอบล่างของแถบขาวเป๊ะๆ (absolute top-full)
                  ไม่มีการเด้งกระตุก แถบเขียวและขาวข้างบนจะไม่หายไปไหน
                */}

                {/* 1. ม่านพื้นหลังสีดำโปร่งแสง */}
                {isMobileMenuOpen && (
                    <div
                        className="md:hidden absolute top-full left-0 right-0 h-[100vh] bg-slate-900/30 backdrop-blur-sm z-30 animate-in fade-in duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                )}

                {/* 2. ตัวกล่องเมนูลิ้นชัก */}
                <div className={`md:hidden absolute top-full left-0 right-0 bg-white z-40 overflow-hidden transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'max-h-[calc(100vh-80px)] border-b border-slate-200 shadow-[0_20px_40px_rgba(0,0,0,0.15)] opacity-100' : 'max-h-0 border-transparent opacity-0 pointer-events-none'}`}>

                    <div className="overflow-y-auto px-6 py-6 flex flex-col h-full max-h-[calc(100vh-80px)] pb-safe custom-scrollbar">

                        {/* ส่วนโปรไฟล์ในเมนูมือถือ (กดเพื่อไปหน้าโปรไฟล์) */}
                        <div className="mb-6 pb-6 border-b border-slate-100 flex items-center justify-between w-full">
                            <button
                                onClick={() => { onProfileClick(); setIsMobileMenuOpen(false); }}
                                className="flex items-center gap-4 text-left flex-1 active:scale-95 transition-transform group outline-none"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden border border-slate-200 group-hover:border-[#006664] transition-colors shrink-0">
                                    {profilePicUrl ? (
                                        <img src={profilePicUrl} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        firstName.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-slate-800 font-bold text-base leading-snug truncate">สวัสดี, {user?.fullname || 'ผู้ใช้งาน'}</div>
                                    <div className="text-[12px] text-slate-500 font-medium mt-0.5">จัดการบัญชีผู้ใช้งาน &rsaquo;</div>
                                </div>
                            </button>
                        </div>

                        {/* เมนูการนำทาง (Clean Minimalist List) */}
                        <div className="flex flex-col gap-1">
                            <button onClick={() => handleNav('home')} className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] text-left transition-colors flex items-center justify-between group outline-none ${currentView === 'home' ? 'bg-[#006664]/5 text-[#006664]' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3.5">
                                    <LayoutDashboard size={20} className={currentView === 'home' ? 'text-[#006664]' : 'text-slate-400 group-hover:text-[#006664] transition-colors'} />
                                    <span>หน้าแรก</span>
                                </div>
                            </button>
                            <button onClick={() => handleNav('booking')} className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] text-left transition-colors flex items-center justify-between group outline-none ${currentView === 'booking' ? 'bg-[#006664]/5 text-[#006664]' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3.5">
                                    <CalendarPlus size={20} className={currentView === 'booking' ? 'text-[#006664]' : 'text-slate-400 group-hover:text-[#006664] transition-colors'} />
                                    <span>จองบริการ</span>
                                </div>
                            </button>
                            <button onClick={() => handleNav('history')} className={`w-full py-3.5 px-4 rounded-xl font-bold text-[15px] text-left transition-colors flex items-center justify-between group outline-none ${currentView === 'history' ? 'bg-[#006664]/5 text-[#006664]' : 'bg-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3.5">
                                    <History size={20} className={currentView === 'history' ? 'text-[#006664]' : 'text-slate-400 group-hover:text-[#006664] transition-colors'} />
                                    <span>ประวัติการจอง</span>
                                </div>
                            </button>
                        </div>

                        {/* ปุ่มออกจากระบบ (อยู่ล่างสุด) */}
                        <div className="mt-8 pb-4">
                            <button onClick={() => { setShowLogoutConfirm(true); setIsMobileMenuOpen(false); }} className="w-full py-3.5 px-4 rounded-xl font-bold text-[14px] flex items-center gap-3.5 text-red-500 bg-transparent hover:bg-red-50 transition-colors active:scale-95 outline-none">
                                <LogOut size={20} /> ออกจากระบบ
                            </button>
                        </div>

                    </div>
                </div>

            </div>

            {/* ===== ป๊อปอัปยืนยันการออกจากระบบ ===== */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="bg-white rounded-[1.75rem] shadow-2xl max-w-sm w-full relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100" onClick={e => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100">
                                <LogOut size={28} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">ออกจากระบบ</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">คุณต้องการออกจากระบบหรือไม่?</p>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-95"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors active:scale-95 shadow-sm shadow-red-500/20"
                            >
                                ยืนยันออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default Navbar;