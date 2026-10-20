import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { Building2, GraduationCap, X, ArrowRight } from 'lucide-react';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const AuthScreen = ({ onLoginSuccess, notify }) => {
    const [isLoading, setIsLoading] = useState(false);

    // State สำหรับควบคุมการเปิด/ปิด ป๊อปอัปต้อนรับบนมือถือ
    const [showMobileWelcome, setShowMobileWelcome] = useState(true);
    useLockBodyScroll(showMobileWelcome);

    // ฟังก์ชันล็อกอินด้วย Google (ผูกกับปุ่ม "เข้าสู่ระบบด้วย Google")
    const login = async () => {
        setIsLoading(true);
        try {
            // 1. เรียกใช้หน้าต่าง Pop-up ของ Google เพื่อให้ผู้ใช้ยืนยันตัวตน
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // 2. ขอกุญแจลับ (ID Token) จาก Firebase เพื่อนำไปใช้ยืนยันกับระบบหลังบ้าน
            const idToken = await user.getIdToken();

            // 3. ส่ง Token และข้อมูลเบื้องต้นวิ่งข้ามไปหาฝั่งหลังบ้าน (Backend API)
            const res = await axios.post('/api/auth/firebase', {
                idToken: idToken,
                // ข้อมูลสำรอง (Backend จะพยายามแกะจาก Token ก่อนเพื่อความปลอดภัย)
                email: user.email,
                name: user.displayName,
                picture: user.photoURL,
                uid: user.uid
            });

            // 4. ถ้าระบบหลังบ้านตอบกลับมาว่าผ่าน (success: true) ให้เปลี่ยนหน้าและแจ้งเตือน
            if (res.data.success) {
                onLoginSuccess(res.data.user);
                notify('success', 'เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับเข้าสู่ระบบ KUCSC Clean');
            }
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            if (err?.response?.data?.code === 'KU_EMAIL_ONLY') {
                // บัญชีที่ไม่ใช่ @ku.th: ออกจากระบบ Firebase ด้วย กันค้างสถานะล็อกอินฝั่ง Firebase
                try { await auth.signOut(); } catch (_) { /* ไม่เป็นไร */ }
                notify('error', 'ไม่สามารถเข้าสู่ระบบได้', 'ระบบนี้ใช้ได้เฉพาะบัญชีอีเมล @ku.th เท่านั้น');
            } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
                // ผู้ใช้ปิดหน้าต่างล็อกอินเอง ไม่ต้องแจ้งว่าผิดพลาด
            } else {
                notify('error', 'เข้าสู่ระบบไม่สำเร็จ', 'เกิดข้อผิดพลาดในการยืนยันตัวตน');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex flex-col lg:flex-row w-full h-screen bg-white selection:bg-[#006664]/20 selection:text-[#006664] overflow-hidden">

            {/* ✨ ================= ป๊อปอัปต้อนรับ (แสดงบนมือถือแบบไม่เต็มจอ) ================= */}
            {showMobileWelcome && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setShowMobileWelcome(false)} // แตะพื้นหลังสีดำเพื่อปิด
                >
                    {/* ตัวกล่องป๊อปอัปสีเขียว */}
                    <div
                        className="bg-[#006664] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 border border-white/10"
                        onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้คลิกโดนกล่องแล้วปิด
                    >
                        {/* กราฟิกตกแต่งพื้นหลัง */}
                        <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-white/5 [clip-path:polygon(0_0,100%_0,0_100%)]"></div>

                        {/* ปุ่ม X มุมขวาบน */}
                        <button
                            onClick={() => setShowMobileWelcome(false)}
                            className="absolute top-5 right-5 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full z-20 transition-colors"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        {/* เนื้อหาด้านใน */}
                        <div className="relative z-10 p-8 flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar">

                            {/* ป้าย Tag */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-l-2 border-[#B2BB1E] bg-white/10 text-white text-[10px] font-bold tracking-widest mb-5 uppercase w-fit">
                                <Building2 size={14} className="text-[#B2BB1E]" />
                                KUCSC Internal Service
                            </div>

                            {/* หัวข้อ ✨ ลดขนาดลงนิดหน่อยให้ดูคลีน */}
                            <h1 className="text-2xl font-extrabold text-white leading-[1.3] mb-4 tracking-normal">
                                ระบบจองบริการแม่บ้าน <br />
                                <span className="text-[#B2BB1E]">วิทยาเขตเฉลิมพระเกียรติฯ</span>
                            </h1>

                            {/* เส้นขีดตกแต่งสำหรับมือถือ (Accent Line) */}
                            <div className="w-10 h-[3px] bg-[#B2BB1E] rounded-full mb-5 opacity-90"></div>

                            {/* รายละเอียด */}
                            <p className="text-white/80 text-[13px] font-medium leading-relaxed mb-10">
                                อำนวยความสะดวกในการดูแลความสะอาดที่พักอาศัย สำหรับนิสิตและบุคลากรภายในวิทยาเขตโดยเฉพาะ
                            </p>

                            {/* ปุ่มดำเนินการต่อ (สีขาว) */}
                            <button
                                onClick={() => setShowMobileWelcome(false)}
                                className="w-full bg-white text-[#006664] py-3.5 rounded-xl font-bold text-[15px] shadow-lg hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                เข้าสู่ระบบ <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ข้อความแจ้งเตือนด้านนอกกล่อง */}
                    <div className="mt-5 text-white/70 text-[11px] font-medium tracking-wide">
                        แตะที่ใดก็ได้เพื่อปิดหน้าต่าง
                    </div>
                </div>
            )}

            {/* ================= ฝั่งซ้าย: แบรนดิ้ง (แสดงเฉพาะบนจอคอม Desktop) ================= */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-[#006664] h-full shrink-0">

                {/* กราฟิกตกแต่งสีขาวที่มุมซ้ายบน */}
                <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-white/5 [clip-path:polygon(0_0,100%_0,0_100%)] z-0"></div>

                {/* เนื้อหาข้อความ */}
                <div className="relative z-10 w-full h-full flex flex-col justify-center p-12 xl:p-20 2xl:p-24 pb-32">
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-[650px]">

                        {/* ป้าย Tag ✨ ย่อให้เล็กลงนิดหน่อย */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border-l-[3px] border-[#B2BB1E] bg-white/5 text-white text-[11px] xl:text-xs font-bold tracking-widest mb-6 uppercase w-fit backdrop-blur-sm">
                            <Building2 size={16} className="text-[#B2BB1E]" />
                            KUCSC Internal Service
                        </div>

                        {/* หัวข้อหลัก */}
                        <h1 className="text-4xl lg:text-5xl xl:text-[54px] font-extrabold text-white leading-[1.25] mb-6 tracking-normal drop-shadow-sm">
                            ระบบจองบริการแม่บ้าน <br />
                            <span className="text-[#B2BB1E]">วิทยาเขตเฉลิมพระเกียรติฯ</span>
                        </h1>

                        {/* เส้นขีดตกแต่ง (Accent Line) */}
                        <div className="w-16 h-1 bg-[#B2BB1E] rounded-full mb-6 shadow-sm"></div>

                        {/* รายละเอียด */}
                        <p className="text-white/80 text-base xl:text-lg font-medium max-w-lg leading-relaxed">
                            อำนวยความสะดวกในการดูแลความสะอาดที่พักอาศัย สำหรับนิสิตและบุคลากรภายในวิทยาเขตโดยเฉพาะ
                        </p>
                    </div>
                </div>
            </div>

            {/* ================= ฝั่งขวา: ฟอร์มล็อกอิน (แสดงทั้งคอมและมือถือ) ================= */}
            <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col h-full overflow-y-auto bg-[#f8fafc] lg:bg-white border-l border-slate-100 relative">

                {/* แถบสีด้านบนสำหรับมือถือ */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#006664] to-[#B2BB1E] lg:hidden z-20"></div>

                {/* ส่วนเนื้อหาหลัก */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 w-full min-h-[600px]">
                    <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700">

                        {/* Header (จัดให้อยู่ตรงกลาง) */}
                        <div className="text-center mb-8 sm:mb-10">
                            <h2 className="text-4xl sm:text-[42px] font-extrabold text-[#006664] tracking-normal mb-2 uppercase">
                                KUCSC <span className="text-[#B2BB1E]">CLEAN</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-[15px] sm:text-[17px]">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                        </div>

                        {/* กล่องล็อกอิน */}
                        <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">

                            {/* กล่องแจ้งเตือนสิทธิ์การใช้งาน */}
                            <div className="mb-8 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex items-start gap-4">
                                <div className="mt-0.5 w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 text-[#006664] shadow-sm">
                                    <GraduationCap size={20} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <h4 className="text-[15px] sm:text-[17px] font-bold text-slate-800 leading-none mb-2">สำหรับบัญชีมหาวิทยาลัย</h4>
                                    <p className="text-[12px] sm:text-[14px] text-slate-500 leading-relaxed font-medium">
                                        สำหรับผู้ใช้อีเมล <span className="font-bold text-[#006664] bg-[#006664]/5 px-1.5 py-0.5 rounded whitespace-nowrap">@ku.th</span> เท่านั้น
                                    </p>
                                </div>
                            </div>

                            {/* เส้นคั่น */}
                            <div className="relative mb-8">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/80"></div></div>
                                <div className="relative flex justify-center text-xs"><span className="bg-white px-4 text-slate-400 font-bold tracking-wide text-[13px]">ดำเนินการต่อด้วย</span></div>
                            </div>

                            {/* ปุ่ม Google Login */}
                            <button
                                onClick={() => login()}
                                disabled={isLoading}
                                className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-[#006664]/30 hover:bg-slate-50/50 text-slate-700 px-6 py-4 rounded-2xl font-bold text-[16px] sm:text-[17px] transition-all duration-300 active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-[#006664] rounded-full animate-spin shrink-0"></div>
                                ) : (
                                    <svg className="shrink-0" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25C22.56 11.47 22.5 10.73 22.38 10H12V14.26H17.92C17.67 15.63 16.86 16.79 15.69 17.57V20.34H19.26C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                                        <path d="M12 23C14.97 23 17.73 22.02 19.26 20.34L15.69 17.57C14.7 18.23 13.45 18.63 12 18.63C9.2 18.63 6.83 16.74 5.94 14.21H2.26V17.06C4.05 20.61 7.74 23 12 23Z" fill="#34A853" />
                                        <path d="M5.94 14.21C5.71 13.53 5.58 12.78 5.58 12C5.58 11.22 5.71 10.47 5.94 9.79V6.94H2.26C1.52 8.41 1.09 10.15 1.09 12C1.09 13.85 1.52 15.59 2.26 17.06L5.94 14.21Z" fill="#FBBC05" />
                                        <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.03L19.34 3.9C17.72 2.39 14.97 1.41 12 1.41C7.74 1.41 4.05 3.8 2.26 7.35L5.94 10.2C6.83 7.67 9.2 5.38 12 5.38Z" fill="#EA4335" />
                                    </svg>
                                )}
                                <span className="truncate">{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
                            </button>
                        </div>
                    </div>
                </div>



            </div>
        </div>
    );
};

export default AuthScreen;