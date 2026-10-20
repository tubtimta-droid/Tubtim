import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, CheckCircle, Clock, History } from 'lucide-react';

import WithdrawalCard from './finance/WithdrawalCard';
import ApproveWithdrawModal from './finance/modals/ApproveWithdrawModal';
import RejectWithdrawModal from './finance/modals/RejectWithdrawModal';

const AdminFinanceTab = ({ notify, requestConfirm, refreshCount }) => {
    // รายการถอนเงินทั้งหมด และมุมมองที่เลือก (pending = รอดำเนินการ, history = ดำเนินการแล้ว)
    const [withdrawals, setWithdrawals] = useState([]);
    const [viewMode, setViewMode] = useState('pending');

    // รหัสคำขอที่กำลังจะอนุมัติ / คำขอที่กำลังจะปฏิเสธ (มีค่า = เปิดป๊อปอัป)
    const [approveWithdrawId, setApproveWithdrawId] = useState(null);

    const [rejectWithdrawal, setRejectWithdrawal] = useState(null);
    // ล็อคหน้าจอพื้นหลังทำใน ApproveWithdrawModal/RejectWithdrawModal เอง (useLockBodyScroll) แล้ว ไม่ต้องล็อคซ้ำที่นี่

    // โหลดคำขอถอนเงินทั้งหมดจาก backend
    const fetchWithdrawals = () => {
        axios.get('/api/admin/withdrawals')
             .then(res => {
                 const formatted = res.data.map((w) => ({ ...w, id: w.withdrawal_id || w.id }));
                 setWithdrawals(formatted);
             })
             .catch(err => console.log('ไม่สามารถโหลดข้อมูลการถอนเงินได้'));
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    // คัดลอกเลขบัญชีไว้วางในแอปธนาคารตอนโอนเงิน
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        notify('info', 'คัดลอกแล้ว', `คัดลอกเลขบัญชี ${text} เรียบร้อย`);
    };

    // กดยืนยันอนุมัติในป๊อปอัป → บันทึกว่าโอนแล้ว แล้วโหลดรายการและตัวเลขบนแท็บใหม่
    const handleApproveWithdraw = async () => {
        try {
            await axios.put(`/api/admin/withdrawals/${approveWithdrawId}/approve`);
            notify('success', 'อนุมัติสำเร็จ', 'บันทึกสถานะการโอนเงินเรียบร้อย');
            setApproveWithdrawId(null);
            fetchWithdrawals();
            if (refreshCount) refreshCount();
        } catch(err) { notify('error', 'ผิดพลาด', 'ไม่สามารถทำรายการได้'); }
    };

    // กดยืนยันปฏิเสธพร้อมเหตุผล → backend คืนเงินเข้า Wallet แม่บ้าน
    const handleRejectWithdraw = async (id, reason) => {
        try {
            await axios.put(`/api/admin/withdrawals/${id}/reject`, { reason });
            notify('success', 'ปฏิเสธสำเร็จ', 'คืนเงินเข้า Wallet พนักงานเรียบร้อย');
            setRejectWithdrawal(null);
            fetchWithdrawals();
            if (refreshCount) refreshCount();
        } catch(err) {
            notify('error', 'ผิดพลาด', err?.response?.data?.error || 'ไม่สามารถทำรายการได้');
        }
    };

    // แยกรายการตามสถานะ และนับจำนวนไว้แสดงบนแท็บกรอง
    const pendingList = withdrawals.filter(w => w.status === 'pending');
    const historyList = withdrawals.filter(w => w.status !== 'pending');
    const displayedList = viewMode === 'pending' ? pendingList : historyList;

    const FILTER_TABS = [
        { id: 'pending', label: 'รอดำเนินการ', icon: Clock },
        { id: 'history', label: 'ดำเนินการแล้ว', icon: History },
    ];

    const filterCounts = {
        'pending': pendingList.length,
        'history': historyList.length,
    };

    return (
        <div className="space-y-6">

            {/* หัวข้อและแท็บกรอง */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3 text-[15px] font-extrabold text-slate-700 px-2 pb-2 lg:pb-0">
                    <div className="w-10 h-10 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] shadow-inner shrink-0">
                        <Wallet size={20} />
                    </div>
                    <div>
                        คำขอถอนเงินพนักงาน <span className="text-slate-400 font-medium ml-1">({withdrawals.length})</span>
                    </div>
                </div>

                {/* แท็บกรอง: รอดำเนินการ / ดำเนินการแล้ว */}
                <div className="flex gap-8 px-2">
                    {FILTER_TABS.map((tab) => {
                        const isActive = viewMode === tab.id;
                        const count = filterCounts[tab.id];

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setViewMode(tab.id)}
                                className={`
                                    relative flex items-center gap-2 py-3 text-sm font-bold transition-all duration-300
                                    ${isActive ? 'text-[#006664]' : 'text-slate-500 hover:text-[#006664]/70'}
                                `}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>

                                <span className={`
                                    px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-all duration-300
                                    ${isActive ? 'bg-[#006664] text-white shadow-sm shadow-[#006664]/20' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {count}
                                </span>

                                {isActive && (
                                    <div className="absolute bottom-[-17px] left-0 right-0 h-[3.5px] bg-[#006664] rounded-t-full shadow-[0_-1px_4px_rgba(0,102,100,0.2)]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* รายการคำขอถอนเงิน */}
            <div className="space-y-5">
                {displayedList.length === 0 ? (
                    <div className="py-20 px-8 text-center flex flex-col items-center bg-white rounded-[2.5rem] border border-slate-100/50 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                        <div className="w-16 h-16 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] mb-6 shadow-inner">
                            {viewMode === 'pending' ? <CheckCircle size={28} /> : <History size={28} />}
                        </div>
                        <p className="text-lg font-extrabold text-slate-800 mb-2">
                            {viewMode === 'pending' ? 'ไม่มีรายการรอดำเนินการ' : 'ยังไม่มีประวัติการทำรายการ'}
                        </p>
                        <p className="text-[15px] font-medium text-slate-400">
                            {viewMode === 'pending' ? 'คุณจัดการคำขอทั้งหมดเรียบร้อยแล้ว' : 'รายการที่อนุมัติหรือปฏิเสธแล้วจะแสดงที่นี่'}
                        </p>
                    </div>
                ) : (
                    displayedList.map((w) => (
                        <WithdrawalCard
                            key={w.id}
                            withdrawal={w}
                            onApproveClick={(id) => setApproveWithdrawId(id)}
                            onRejectClick={(withdrawal) => setRejectWithdrawal(withdrawal)}
                            copyToClipboard={copyToClipboard}
                        />
                    ))
                )}
            </div>

            {/* ป๊อปอัปอนุมัติ / ปฏิเสธ */}
            {approveWithdrawId && <ApproveWithdrawModal onClose={() => setApproveWithdrawId(null)} onSubmit={handleApproveWithdraw} />}
            {rejectWithdrawal && <RejectWithdrawModal withdrawal={rejectWithdrawal} onClose={() => setRejectWithdrawal(null)} onSubmit={handleRejectWithdraw} />}
        </div>
    );
};

export default AdminFinanceTab;
