import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Briefcase } from 'lucide-react';

// นำเข้า Components ที่แยกเอาไว้
import TopMaidsRanking from './maids/TopMaidsRanking';
import AdminMaidCard from './maids/AdminMaidCard';

const AdminMaidsTab = ({ notify, requestConfirm }) => {
    const [maids, setMaids] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // โหลดรายชื่อแม่บ้าน แล้วสร้างฟิลด์ name จาก คำนำหน้า+ชื่อ+นามสกุล
    const fetchData = () => {
        axios.get('/api/maids?all=true')
            .then(res => {
                const formatted = res.data.map((m) => ({
                    ...m,
                    id: m.maid_id,
                    name: `${m.title_prefix || ''}${m.first_name || ''} ${m.last_name || ''}`.trim() || 'ไม่ระบุ'
                }));
                setMaids(formatted);
            })
            .catch(err => notify('error', 'Error', 'โหลดข้อมูลแม่บ้านไม่สำเร็จ'));
    };

    useEffect(() => { fetchData(); }, []);

    // เรียงแม่บ้าน: คะแนนเฉลี่ยมากก่อน ถ้าเท่ากันดูจำนวนรีวิว
    const sortedMaids = [...maids].sort((a, b) => {
        const ratingA = parseFloat(a.average_rating || 0);
        const ratingB = parseFloat(b.average_rating || 0);
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (parseInt(b.total_reviews) || 0) - (parseInt(a.total_reviews) || 0);
    });

    // กรองตามคำค้นหา (ชื่อ หรือ เบอร์โทร)
    const filteredMaids = sortedMaids.filter(m => {
        const matchSearch = (m.name?.includes(searchTerm) || m.phone?.includes(searchTerm));
        return matchSearch;
    });

    // 3 อันดับแรกไปแสดงบนแท่นอันดับ
    const topMaids = sortedMaids.slice(0, 3);

    return (
        <div className="space-y-6">

            {/* หัวข้อและช่องค้นหา */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3 text-[15px] font-extrabold text-slate-700 px-2 pb-2 lg:pb-0">
                    <div className="w-10 h-10 bg-[#006664]/10 rounded-full flex items-center justify-center text-[#006664] shadow-inner shrink-0">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        พนักงานทั้งหมด <span className="text-slate-400 font-medium ml-1">({filteredMaids.length})</span>
                    </div>
                </div>

                <div className="relative w-full lg:w-[320px] shrink-0 self-end">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#006664]/60">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาพนักงาน, ชื่อ, เบอร์โทร..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 text-[14px] font-medium rounded-full outline-none focus:border-[#006664] focus:ring-4 focus:ring-[#006664]/10 transition-all placeholder:font-normal"
                    />
                </div>
            </div>

            {/* แท่นจัดอันดับ Top 3 */}
            {searchTerm === '' && <TopMaidsRanking topMaids={topMaids} />}

            {/* รายชื่อพนักงานทั้งหมด */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100/50 animate-in fade-in">
                <div className="flex justify-between items-center mb-6 pl-2">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#B2BB1E]/20 rounded-full flex items-center justify-center text-[#B2BB1E] shrink-0">
                            <Briefcase size={16} />
                        </div>
                        รายชื่อพนักงานในระบบ
                    </h3>
                </div>

                <div className="space-y-4">
                    {filteredMaids.length === 0 ? (
                        <div className="text-center py-16 flex flex-col items-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                 <Search size={24} />
                             </div>
                             <p className="text-[15px] font-bold text-slate-600 mb-1">ไม่พบข้อมูลพนักงาน</p>
                             <p className="text-[13px] text-slate-400">ลองคำค้นหาอื่น</p>
                        </div>
                    ) : filteredMaids.map((m, index) => (
                        <AdminMaidCard
                            key={m.id}
                            maid={m}
                            rank={index + 1}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default AdminMaidsTab;