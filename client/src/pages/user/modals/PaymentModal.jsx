import React, { useState } from 'react';
import { QrCode, AlertCircle } from 'lucide-react';
import useLockBodyScroll from '../../../hooks/useLockBodyScroll';

const PaymentModal = ({ payModal, onClose, onUpload }) => {
    // ไฟล์สลิปที่เลือก และข้อความเตือนถ้ายังไม่ได้แนบ
    const [slipFile, setSlipFile] = useState(null);
    const [uploadError, setUploadError] = useState('');

    useLockBodyScroll(!!payModal);

    if (!payModal) return null;

    // ต้องแนบสลิปก่อนจึงยืนยันได้
    const handleConfirm = () => {
        if (!slipFile) {
            setUploadError('กรุณาแนบรูปภาพสลิปก่อนแจ้งโอน');
            return;
        }
        onUpload(slipFile, payModal.booking_id);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">
                <div className="bg-[#006664] p-8 text-center text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><QrCode size={80} /></div>
                    <h3 className="font-bold text-xl mb-1 relative z-10">ชำระค่าบริการ</h3>
                    <p className="text-[#B2BB1E] text-base font-bold relative z-10">ยอดชำระ ฿{payModal.total_price}</p>
                </div>
                <div className="p-6 md:p-8 text-center">
                    <div className="bg-white border-2 border-[#006664]/10 rounded-2xl p-5 inline-block mb-4 shadow-sm">
                        <img src="/payment-qr.jpg" className="w-40 h-40 mx-auto object-contain" alt="QR Code ชำระเงิน" />
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 mb-6 border border-slate-100">
                        <p className="text-xs text-slate-600 font-bold">ธนาคารกรุงไทย</p>
                        <p className="text-base font-mono font-bold text-[#006664] my-1 tracking-wider">099-XXX-XXXX</p>
                        <p className="text-[10px] text-slate-500 font-bold">KUCSC Clean</p>
                    </div>

                    <div className="text-left mb-8">
                        <label className="block text-xs font-bold text-slate-600 mb-2">แนบรูปภาพสลิป <span className="text-red-500">*</span></label>
                        <input type="file" accept="image/*" onChange={(e) => { setSlipFile(e.target.files ? e.target.files[0] : null); setUploadError(''); }} className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#006664]/10 file:text-[#006664] hover:file:bg-[#006664]/20 transition cursor-pointer ${uploadError ? 'text-red-500 file:bg-red-50 file:text-red-600' : ''}`} />
                        {uploadError && <div className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12} /> {uploadError}</div>}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">ยกเลิก</button>
                        <button onClick={handleConfirm} className="flex-1 bg-[#006664] text-[#B2BB1E] py-3.5 rounded-xl font-bold text-sm hover:bg-[#004d4b] transition-colors shadow-md active:scale-95">แจ้งโอนเงิน</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;