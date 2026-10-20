import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Users, Wallet } from 'lucide-react';

import AdminBookingsTab from '../admin/AdminBookingsTab';
import AdminMaidsTab from '../admin/AdminMaidsTab';
import AdminFinanceTab from '../admin/AdminFinanceTab';

const AdminView = ({ notify, requestConfirm }) => {
    // แท็บที่เลือกอยู่ (bookings / maids / finance) และจำนวนคำขอถอนเงินที่รออนุมัติ
    const [activeTab, setActiveTab] = useState('bookings');
    const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState(0);

    // นับคำขอถอนเงินที่ยัง pending จาก GET /api/admin/withdrawals เพื่อแสดงเป็นตัวเลขบนแท็บ
    const fetchPendingCount = () => {
        axios.get('/api/admin/withdrawals')
            .then(res => {
                const pending = res.data.filter(w => w.status === 'pending');
                setPendingWithdrawalsCount(pending.length);
            })
            .catch(err => console.log('Error fetching withdrawals for badge'));
    };

    // โหลดตัวเลขทันทีตอนเปิดหน้า แล้วโหลดซ้ำทุก 15 วินาที (เลิกเมื่อออกจากหน้า)
    useEffect(() => {
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-12 bg-[#f8fafc] min-h-screen text-slate-800">
            {/* หัวข้อหน้าแอดมินและแท็บ */}
            <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] shadow-inner shrink-0">
                        <LayoutDashboard size={26} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-normal animate-in fade-in">
                            Admin
                        </h1>
                        <div className="h-1 w-12 bg-[#B2BB1E]/30 rounded-full mt-1.5 mb-1.5"></div>
                        <p className="text-slate-500 font-medium text-[13px] md:text-sm animate-in fade-in slide-in-from-bottom-2">
                            ระบบจัดการหลังบ้าน KUCSC CLEAN 
                        </p>
                    </div>
                </div>

                {/* ปุ่มสลับแท็บ: รายการจอง / พนักงาน / คำขอถอนเงิน */}
                <div className="flex bg-white p-1.5 rounded-full w-full md:w-auto overflow-x-auto custom-scrollbar animate-in fade-in relative shadow-sm border border-slate-100/50">
                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`whitespace-nowrap flex-1 md:flex-none px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'bookings' ? 'bg-[#006664] text-white shadow-md shadow-[#006664]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <LayoutDashboard size={18} /> รายการจอง
                    </button>
                    <button
                        onClick={() => setActiveTab('maids')}
                        className={`whitespace-nowrap flex-1 md:flex-none px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'maids' ? 'bg-[#006664] text-white shadow-md shadow-[#006664]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Users size={18} /> พนักงาน
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`whitespace-nowrap flex-1 md:flex-none px-6 py-3 rounded-full text-[14px] font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'finance' ? 'bg-[#006664] text-white shadow-md shadow-[#006664]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                        <Wallet size={18} /> คำขอถอนเงิน
                        {pendingWithdrawalsCount > 0 && (
                            <span className={`ml-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${activeTab === 'finance' ? 'bg-white text-[#006664] shadow-sm' : 'bg-teal-50 text-[#006664] border border-teal-100'}`}>
                                {pendingWithdrawalsCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* เนื้อหาของแท็บที่เลือก — ส่ง notify/requestConfirm ต่อให้ใช้แจ้งเตือนและถามยืนยัน */}
            <div className="animate-in fade-in duration-500">
                {activeTab === 'bookings' && <AdminBookingsTab notify={notify} requestConfirm={requestConfirm} />}
                {activeTab === 'maids' && <AdminMaidsTab notify={notify} requestConfirm={requestConfirm} />}
                {activeTab === 'finance' && <AdminFinanceTab notify={notify} requestConfirm={requestConfirm} refreshCount={fetchPendingCount} />}
            </div>
        </div>
    );
};

export default AdminView;