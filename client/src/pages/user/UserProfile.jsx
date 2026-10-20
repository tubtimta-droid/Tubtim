import React, { useState, useRef } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Edit3, Camera, Save, X, AlertCircle } from 'lucide-react';

const UserProfile = ({ user, updateUserState, notify }) => {
    // isEditing = อยู่ในโหมดแก้ไขไหม, isLoading = กำลังบันทึก, formError = ข้อความแจ้งเมื่อกรอกไม่ครบ
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    
    // แยกชื่อเต็ม (fullname) เป็นชื่อจริงกับนามสกุล เพื่อแสดงในช่องกรอก 2 ช่อง
    const getNameParts = (fullName) => {
        if (!fullName) return { first: '', last: '' };
        const parts = fullName.trim().split(' ');
        const first = parts[0] || '';
        const last = parts.length > 1 ? parts.slice(1).join(' ') : '';
        return { first, last };
    };

    const initialNames = getNameParts(user?.fullname);

    const [form, setForm] = useState({
        firstName: initialNames.first,
        lastName: initialNames.last,
        phone: user?.phone || ''
    });

    // รูปที่เลือกใหม่ (ไฟล์) และรูปตัวอย่างที่แสดงก่อนบันทึก
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(
        user?.profile_pic 
            ? (user.profile_pic.startsWith('http') ? user.profile_pic : `/backend-images${user.profile_pic}`) 
            : null
    );
    const fileInputRef = useRef(null);

    // เลือกรูปใหม่ → แสดงตัวอย่างทันที (ยังไม่อัปโหลดจนกว่าจะกดบันทึก)
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
            setIsEditing(true); 
            setFormError(''); 
        }
    };

    // กดบันทึก: ตรวจว่ากรอกชื่อครบ → รวมชื่อ-นามสกุลเป็น fullname → ส่งไป backend
    const handleSave = async () => {
        setFormError(''); 

        if (!form.firstName.trim() || !form.lastName.trim()) {
            setFormError('กรุณาระบุทั้งชื่อและนามสกุลให้ครบถ้วน');
            return; 
        }

        setIsLoading(true);
        const formData = new FormData();
        
        const combinedFullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
        
        formData.append('fullname', combinedFullName);
        formData.append('phone', form.phone);
        if (profileImage) formData.append('profile_pic', profileImage);

        try {
            const res = await axios.put(`/api/users/${user.user_id}/profile`, formData);
            if (res.data.success) {
                notify('success', 'อัปเดตโปรไฟล์สำเร็จ', 'ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว');
                setIsEditing(false);
                if (updateUserState) updateUserState(res.data.user);
            }
        } catch (err) {
            if (err?.response?.status === 404) {
                // บัญชีที่เบราว์เซอร์จำไว้ไม่ตรงกับฐานข้อมูล (เช่นรหัสผู้ใช้ถูกเปลี่ยน) ต้องล็อกอินใหม่เพื่อดึงข้อมูลล่าสุด
                notify('error', 'ไม่พบบัญชีผู้ใช้', 'ข้อมูลบัญชีที่จำไว้ไม่ตรงกับระบบ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
            } else {
                notify('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ยกเลิกการแก้ไข: คืนค่าทุกช่องกลับเป็นข้อมูลเดิม
    const cancelEdit = () => {
        setIsEditing(false);
        setFormError(''); 
        const names = getNameParts(user?.fullname);
        setForm({ firstName: names.first, lastName: names.last, phone: user?.phone || '' });
        setProfileImage(null);
        setPreviewImage(user?.profile_pic ? (user.profile_pic.startsWith('http') ? user.profile_pic : `/backend-images${user.profile_pic}`) : null);
    };

    return (
        <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 md:py-10 px-4 sm:px-0">
            
            {/* ส่วนหัวข้อหน้าเว็บ */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-normal">บัญชีของฉัน</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">จัดการข้อมูลส่วนตัวและการติดต่อของคุณ</p>
                </div>
            </div>

            {/* การ์ดหลัก */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                
                {/* --- 1. Section ข้อมูลด้านบน (รูปโปรไฟล์ & ชื่อ & อีเมล) --- */}
                <div className="p-6 md:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 border-b border-slate-100 relative">
                    
                    {/* กรอบรูปโปรไฟล์ */}
                    <div className="relative shrink-0 group">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl ring-4 ring-white bg-slate-50 border border-slate-100 flex items-center justify-center relative z-10">
                            {previewImage ? (
                                <img src={previewImage} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                            ) : (
                                <User size={50} className="text-slate-300" />
                            )}
                            
                            {isEditing && (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera size={24} className="mb-1"/>
                                    <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="absolute bottom-1 right-1 w-9 h-9 bg-white text-[#006664] rounded-full flex items-center justify-center shadow-lg border border-slate-100 hover:bg-slate-50 hover:scale-105 transition-all duration-200 z-20"
                                title="เปลี่ยนรูปโปรไฟล์"
                            >
                                <Camera size={16} strokeWidth={2.5} />
                            </button>
                        )}
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                    </div>

                    {/* ข้อมูลชื่อและอีเมล (อีเมลอยู่ตรงนี้แล้ว เลยไม่ต้องมีในฟอร์มอีก) */}
                    <div className="flex-1 text-center sm:text-left mt-2 sm:mt-4">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-normal">
                                {user?.fullname || 'ผู้ใช้ใหม่'}
                            </h3>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg w-fit mx-auto sm:mx-0 border border-slate-100">
                            <Mail size={14} className="text-slate-400" />
                            {user?.email}
                        </p>
                    </div>

                    {/* ปุ่ม Action ขวาบน */}
                    <div className="shrink-0 mt-4 sm:mt-4">
                        {!isEditing ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:border-[#006664] hover:text-[#006664] transition-all duration-300 shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95"
                            >
                                <Edit3 size={16} /> แก้ไขข้อมูล
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full">
                                <button 
                                    onClick={cancelEdit}
                                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    <X size={16} /> ยกเลิก
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className={`px-6 py-3 bg-[#006664] text-white rounded-2xl font-bold text-sm hover:bg-[#004d4b] shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
                                    {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 2. Section ฟอร์มกรอกข้อมูล --- */}
                <div className="p-6 md:p-10 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wider flex items-center gap-2">
                        รายละเอียดข้อมูลส่วนตัว
                    </h4>

                    {formError && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0" /> {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        
                        {/* ชื่อจริง (อยู่คอลัมน์ซ้าย) */}
                        <div className={`p-5 rounded-2xl border transition-all duration-300 ${isEditing ? 'bg-white border-[#006664]/20 shadow-[0_0_0_4px_rgba(0,102,100,0.05)]' : 'bg-slate-50 border-slate-100'}`}>
                            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${formError && !form.firstName.trim() ? 'text-red-500' : 'text-slate-400'}`}>
                                <User size={14} /> ชื่อจริง {formError && !form.firstName.trim() && '*'}
                            </label>
                            <input 
                                type="text" 
                                disabled={!isEditing}
                                value={form.firstName}
                                onChange={(e) => { 
                                    const val = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '');
                                    setForm({...form, firstName: val}); 
                                    setFormError(''); 
                                }}
                                className="w-full bg-transparent text-slate-800 font-bold text-base outline-none disabled:text-slate-700"
                                placeholder="ระบุชื่อจริง"
                            />
                        </div>

                        {/* นามสกุล (อยู่คอลัมน์ขวา) */}
                        <div className={`p-5 rounded-2xl border transition-all duration-300 ${isEditing ? 'bg-white border-[#006664]/20 shadow-[0_0_0_4px_rgba(0,102,100,0.05)]' : 'bg-slate-50 border-slate-100'}`}>
                            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${formError && !form.lastName.trim() ? 'text-red-500' : 'text-slate-400'}`}>
                                นามสกุล {formError && !form.lastName.trim() && '*'}
                            </label>
                            <input 
                                type="text" 
                                disabled={!isEditing}
                                value={form.lastName}
                                onChange={(e) => { 
                                    const val = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '');
                                    setForm({...form, lastName: val}); 
                                    setFormError(''); 
                                }}
                                className="w-full bg-transparent text-slate-800 font-bold text-base outline-none disabled:text-slate-700"
                                placeholder="ระบุนามสกุล"
                            />
                        </div>

                        {/* เบอร์โทรศัพท์ (✨ ปรับให้กินพื้นที่เต็ม 2 คอลัมน์ จะได้ไม่ดูแหว่ง) */}
                        <div className={`p-5 rounded-2xl border transition-all duration-300 sm:col-span-2 ${isEditing ? 'bg-white border-[#006664]/20 shadow-[0_0_0_4px_rgba(0,102,100,0.05)]' : 'bg-slate-50 border-slate-100'}`}>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <Phone size={14} /> เบอร์โทรศัพท์ติดต่อ
                            </label>
                            <input 
                                type="tel" 
                                disabled={!isEditing}
                                value={form.phone}
                                maxLength={10}
                                onChange={(e) => { setForm({...form, phone: e.target.value.replace(/[^0-9]/g, '')}); setFormError(''); }}
                                className={`w-full bg-transparent font-bold text-base outline-none ${!form.phone && !isEditing ? 'text-amber-500' : 'text-slate-800 disabled:text-slate-700'}`}
                                placeholder={isEditing ? "ระบุเบอร์ 10 หลัก" : "ยังไม่ได้ระบุเบอร์โทรศัพท์"}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;