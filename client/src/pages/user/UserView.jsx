import React, { useState } from 'react';

import UserHomeTab from './UserHomeTab';
import UserBookingTab from './UserBookingTab';
import UserHistoryTab from './UserHistoryTab';

const UserView = ({ user, activeTab, setActiveTab, requestConfirm }) => {
    // ข้อความแจ้งผลที่จะแสดงบนหน้าประวัติ (เช่น หลังจองสำเร็จ) หายเองใน 5 วินาที
    const [statusMsg, setStatusMsg] = useState(null);

    // จองสำเร็จ → พาไปหน้าประวัติ แสดงข้อความสำเร็จ และเลื่อนขึ้นบนสุด
    const handleBookingSuccess = () => {
        setActiveTab('history'); 
        setStatusMsg({ type: 'success', text: 'ส่งคำขอจองสำเร็จ! กรุณารอพนักงานกดรับงานค่ะ' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setStatusMsg(null), 5000);
    };

    return (
        <div className="text-slate-800 bg-[#f8fafc] min-h-screen">
            {/* เนื้อหาหลักจะเปลี่ยนตาม Tab ที่เลือก */}
            {/* ✨ ปลดล็อค `relative z-10` ออกจากตรงนี้ เพื่อให้ป๊อปอัปของหน้าจอง ลอยทะลุแถบเมนูด้านบนได้ */}
            <div className={`animate-in fade-in duration-500 ${activeTab === 'home' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-10'}`}>
                {activeTab === 'home' ? (
                    <UserHomeTab goToBooking={() => setActiveTab('booking')} />
                ) : activeTab === 'booking' ? (
                    <UserBookingTab user={user} onSuccess={handleBookingSuccess} />
                ) : (
                    <UserHistoryTab user={user} requestConfirm={requestConfirm} statusMsg={statusMsg} setStatusMsg={setStatusMsg} goToBooking={() => setActiveTab('booking')} />
                )}
            </div>

        </div>
    );
};

export default UserView;