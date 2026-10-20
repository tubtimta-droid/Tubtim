import React, { useState, useEffect } from 'react';
import { Star, X, User } from 'lucide-react';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const ReviewModal = ({ isOpen, booking, onClose, onSubmit }) => {
    // รีวิวได้ครั้งเดียวต่อการจอง: คะแนนดาว + ข้อความ (ข้อความไม่บังคับ)
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');

    const isVisible = isOpen || booking;
    useLockBodyScroll(!!isVisible);

    // แม่บ้านผู้ให้บริการของงานนี้ (แสดงชื่อและรูปในป๊อปอัป)
    const maid = (booking?.assigned_maids || []).find((m) => m.maid_status !== 'rejected' && m.maid_status !== 'replaced');
    const maidName = maid
        ? (`${maid.title_prefix || ''}${maid.first_name || ''} ${maid.last_name || ''}`.trim() || `แม่บ้าน #${maid.maid_id}`)
        : 'พนักงานผู้ให้บริการ';

    // เปิดป๊อปอัปใหม่ → เริ่มจากคะแนน 5 ดาวและช่องข้อความว่าง
    useEffect(() => {
        if (isVisible) {
            setRating(5);
            setReview('');
        }
    }, [isVisible, booking?.booking_id]);

    if (!isVisible || !booking) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors z-20">
                    <X size={18}/>
                </button>

                <div className="text-center mb-6 mt-2 shrink-0">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#B2BB1E]/20 text-[#B2BB1E] mb-3">
                        <Star size={24} fill="currentColor" />
                    </div>
                    <h3 className="font-bold text-xl text-[#006664]">ประเมินความพึงพอใจ</h3>
                </div>

                <div className="overflow-y-auto pr-2 pb-4 flex-1">
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl relative">
                        {/* ส่วนหัว */}
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200/50">
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                                {maid?.profile_pic ? (
                                    <img
                                        src={maid.profile_pic.startsWith('http') ? maid.profile_pic : `/backend-images${maid.profile_pic}`}
                                        alt={maidName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(maidName)}&background=f1f5f9&color=64748b`; }}
                                    />
                                ) : (
                                    <User size={18} className="text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{maidName}</p>
                                <p className="text-[10px] text-[#006664] font-bold">พนักงานผู้ให้บริการ</p>
                            </div>
                        </div>

                        {/* ให้คะแนนดาว */}
                        <div className="flex justify-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`transition-all duration-200 active:scale-90 ${rating >= star ? 'text-[#B2BB1E] scale-110' : 'text-slate-200 hover:text-slate-300'}`}
                                >
                                    <Star size={32} fill={rating >= star ? 'currentColor' : 'none'} strokeWidth={rating >= star ? 0 : 2} />
                                </button>
                            ))}
                        </div>

                        {/* ช่องเขียนความคิดเห็น */}
                        <div>
                            <textarea
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="แสดงความคิดเห็น..."
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#006664] focus:ring-2 focus:ring-[#006664]/20 transition-all resize-none text-[13px] font-medium"
                                rows={2}
                                maxLength={1000}
                            ></textarea>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-4 shrink-0 pt-4 border-t border-slate-100">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors text-[15px] active:scale-95"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={() => onSubmit(booking.booking_id, { rating, review })} 
                        disabled={rating < 1} 
                        className="flex-1 py-3.5 rounded-xl font-bold text-[#B2BB1E] bg-[#006664] hover:bg-[#004d4b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-[15px] active:scale-95"
                    >
                        ส่งรีวิว
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReviewModal;