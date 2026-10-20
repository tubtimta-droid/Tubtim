import React, { useState } from 'react';
import { X, Wallet, ShieldOff, AlertTriangle, Landmark, UserX, PhoneOff, Info, MapPinOff, Ban, HelpCircle } from 'lucide-react';
import useLockBodyScroll from '../../../../hooks/useLockBodyScroll';

// ปัดเศษเป็นทศนิยม 2 ตำแหน่ง (หน่วยเงินบาท)
const round2 = (n) => Math.round(n * 100) / 100;

// เหตุผลที่แม่บ้าน (ไม่ใช่ลูกค้า) เป็นคนแจ้งเข้ามา
const MAID_REPORT_META = {
    maid_no_contact: { label: 'ติดต่อผู้ว่าจ้างไม่ได้', icon: PhoneOff },
    maid_location_not_found: { label: 'หาพิกัดสถานที่ปฏิบัติงานไม่พบ', icon: MapPinOff },
    maid_unsafe_site: { label: 'สภาพหน้างานไม่ปลอดภัย/ไม่ตรงกับที่ระบุ', icon: AlertTriangle },
    maid_sudden_cancel: { label: 'ผู้ว่าจ้างขอยกเลิกกะทันหันที่หน้างาน', icon: Ban },
    maid_other: { label: 'อื่นๆ (แม่บ้านระบุเอง)', icon: HelpCircle },
};

// เหตุผลฝั่งแม่บ้านที่มีนโยบายมาตรฐานให้กดเลือกได้เลย (แม่บ้านพยายามไปทำงานแล้วแต่ติดปัญหาที่ไม่ใช่ความผิดตัวเอง)
// คืนลูกค้า 80% + ชดเชยแม่บ้าน 20% เหมือนกันทุกเหตุผล ส่วน maid_other ไม่มีค่าเริ่มต้น ให้กรอกเองอย่างเดียว
const MAID_STANDARD_POLICY_TYPES = ['maid_no_contact', 'maid_location_not_found', 'maid_unsafe_site', 'maid_sudden_cancel'];

const SettleDisputeModal = ({ booking, onClose, onSubmit }) => {
    useLockBodyScroll();
    // เรื่องนี้แม่บ้านเป็นคนแจ้งไหม (ใช้เลือกชุดนโยบายที่จะแสดง) และยอดค่าบริการทั้งหมด
    const isMaidReport = MAID_REPORT_META.hasOwnProperty(booking.reason_type);
    const totalPrice = Number(booking.total_price) || 0;

    // decision = นโยบายที่แอดมินเลือก
    const [decision, setDecision] = useState(null);
    const [loading, setLoading] = useState(false);
    // "อื่นๆ (กำหนดเอง)" ใช้ร่วมกันทั้งฝั่งลูกค้าแจ้งและแม่บ้านแจ้ง กรอกยอดบาทตรงๆ ทั้งสองช่อง (คนละเรื่องกัน ไม่ใช่การแบ่ง 100%
    // เพราะยอดแม่บ้านอาจติดลบได้ถ้าเงินเข้าวอลเลทอัตโนมัติไปแล้วก่อนหน้า)
    const [customAmountToUser, setCustomAmountToUser] = useState('');
    const [customAmountToMaid, setCustomAmountToMaid] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [rejectReason, setRejectReason] = useState('');

    // คืนเงินลูกค้าห้ามติดลบและห้ามเกินยอดค่าบริการทั้งหมด (คืนได้มากสุดเท่าที่ลูกค้าจ่ายมาจริง)
    const handleCustomAmountToUserChange = (v) => {
        if (v === '') { setCustomAmountToUser(''); return; }
        let num = Number(v);
        if (isNaN(num)) return;
        if (num < 0) num = 0;
        if (num > totalPrice) num = totalPrice;
        setCustomAmountToUser(String(num));
    };

    // นโยบายสำหรับเรื่องที่ "ลูกค้า" แจ้ง (amountToMaid ติดลบ = หักเงินจากวอลเลทแม่บ้าน)
    const POLICIES = [
        {
            id: 'no_show',
            icon: UserX,
            title: 'แม่บ้านไม่ได้เดินทางมาปฏิบัติงานตามนัดหมาย',
            description: `คืนเงินลูกค้าเต็มจำนวน 100% (฿${round2(totalPrice)}) ผ่านการโอนภายนอกระบบ โดยแม่บ้านจะไม่ได้รับค่าตอบแทนสำหรับงานนี้`,
            status: 'refunded',
            amountToUser: round2(totalPrice),
            amountToMaid: 0,
        },
        {
            id: 'service_mismatch',
            icon: AlertTriangle,
            title: 'การให้บริการไม่เป็นไปตามรายละเอียดที่ลูกค้าแจ้งไว้',
            description: `คืนเงินลูกค้า 50% (฿${round2(totalPrice * 0.5)}) ผ่านการโอนภายนอกระบบ และหักยอดวอลเลทแม่บ้าน 50% (฿${round2(totalPrice * 0.5)}) เข้าวอลเลทให้อัตโนมัติ`,
            status: 'refunded',
            amountToUser: round2(totalPrice * 0.5),
            amountToMaid: round2(-(totalPrice * 0.5)),
        },
        {
            id: 'reject',
            icon: ShieldOff,
            title: 'ปฏิเสธคำขอคืนเงิน',
            description: 'กรณีเหตุผลที่ลูกค้าแจ้งไม่สอดคล้องกับข้อเท็จจริง ลูกค้าจะไม่ได้รับเงินคืน แม่บ้านยังคงได้รับค่าตอบแทนเต็มจำนวนตามเดิม',
            status: 'rejected',
            amountToUser: 0,
            amountToMaid: 0,
        },
    ];

    const isCustomSelected = decision === 'custom';
    const isCustomAmountValid = customAmountToUser !== '' && !isNaN(parseFloat(customAmountToUser)) && customReason.trim() !== '';

    // นโยบายมาตรฐานฝั่งแม่บ้านแจ้ง (คืนลูกค้า 80% + ชดเชยแม่บ้าน 20%) โชว์ให้เลือกทุกเหตุผล ไม่ล็อกตาม reason_type ของ booking นี้
    // เพราะเป็นแค่ข้อมูลที่แม่บ้านระบุมาเอง แอดมินควรเห็นตัวเลือกทั้งหมดแล้วตัดสินใจเอง เหมือนฝั่งลูกค้าแจ้ง
    const maidStandardPolicies = MAID_STANDARD_POLICY_TYPES.map((type) => ({
        id: type,
        icon: MAID_REPORT_META[type].icon,
        title: MAID_REPORT_META[type].label,
        description: `คืนเงินลูกค้า 80% (฿${round2(totalPrice * 0.8)}) ผ่านการโอนภายนอกระบบ และคืนเงินแม่บ้าน 20% (฿${round2(totalPrice * 0.2)}) เข้าวอลเลทให้อัตโนมัติ`,
        status: 'refunded',
        amountToUser: round2(totalPrice * 0.8),
        amountToMaid: round2(totalPrice * 0.2),
    }));

    // นโยบายกำหนดเอง: ใช้ยอดที่แอดมินพิมพ์
    const customPolicy = {
        id: 'custom',
        status: 'refunded',
        amountToUser: round2(parseFloat(customAmountToUser) || 0),
        amountToMaid: round2(parseFloat(customAmountToMaid) || 0),
    };

    // นโยบายที่ถูกเลือกจริง ตามว่าเป็นเรื่องที่ลูกค้าหรือแม่บ้านแจ้ง
    const selectedPolicy = isCustomSelected
        ? customPolicy
        : (isMaidReport
            ? (maidStandardPolicies.find((p) => p.id === decision) || null)
            : (POLICIES.find((p) => p.id === decision) || null));

    const canSubmit = isCustomSelected ? isCustomAmountValid : !!selectedPolicy;

    // กดยืนยัน → ส่งผลการตัดสินให้ AdminBookingsTab (handleSettleDispute) เรียก API
    const handleSettle = async () => {
        if (!canSubmit) return;
        setLoading(true);
        await onSubmit(booking.refund_id, {
            status: selectedPolicy.status,
            amount_to_user: selectedPolicy.amountToUser,
            amount_to_maid: selectedPolicy.amountToMaid,
            admin_note: isCustomSelected ? customReason.trim() : (decision === 'reject' && rejectReason.trim() ? rejectReason.trim() : undefined),
        });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full relative overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full z-50 transition-colors"><X size={18} /></button>

                <div className="bg-slate-50 px-6 py-6 border-b border-slate-100">
                    <h3 className="font-bold text-xl text-slate-800">พิจารณาคำขอคืนเงิน</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">หมายเลขการจอง #{booking.booking_id}</p>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                    {/* ข้อมูลเรื่องที่แจ้ง */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">{isMaidReport ? 'เหตุผลที่แม่บ้านแจ้งเข้ามา' : 'เหตุผลที่ลูกค้าแจ้งเข้ามา'}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic mb-3">
                            "{booking.reason_text || 'ไม่ได้ระบุรายละเอียด'}"
                        </div>
                        {booking.refund_bank_name && (
                            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1.5 text-amber-700">
                                    <Landmark size={13} />
                                    <span className="text-[11px] font-bold">บัญชีสำหรับโอนเงินคืนลูกค้า (ดำเนินการนอกระบบ)</span>
                                </div>
                                <div className="text-xs font-semibold text-slate-700">
                                    {booking.refund_bank_name} · <span className="font-mono">{booking.refund_account_number}</span> · {booking.refund_account_name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ตัวเลือกผลการตัดสิน (นโยบาย) */}
                    <div className="space-y-3">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">โปรดเลือกแนวทางการพิจารณา ดังนี้</label>

                        <div className="grid grid-cols-1 gap-3">
                            {(isMaidReport ? maidStandardPolicies : POLICIES).map((policy) => {
                                const Icon = policy.icon;
                                const isSelected = decision === policy.id;
                                return (
                                    <button
                                        key={policy.id}
                                        onClick={() => setDecision(policy.id)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all relative ${isSelected ? 'border-[#006664] bg-[#006664]/5 ring-4 ring-[#006664]/10' : 'border-slate-100 hover:border-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#006664] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-800">{policy.title}</div>
                                                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{policy.description}</div>
                                            </div>
                                        </div>

                                    </button>
                                );
                            })}

                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setDecision('custom')}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDecision('custom'); }}
                                className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${isCustomSelected ? 'border-[#006664] bg-[#006664]/5 ring-4 ring-[#006664]/10' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCustomSelected ? 'bg-[#006664] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">อื่นๆ (กำหนดเอง)</div>
                                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">กรณีไม่ตรงกับนโยบายด้านบน ระบุยอดคืนเงินและเหตุผลเอง</div>
                                    </div>
                                </div>

                                {isCustomSelected && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                                        <span className="inline-block text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">ค่าบริการทั้งหมด ฿{round2(totalPrice).toLocaleString('th-TH')}</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[12px] font-bold text-slate-600 block mb-1">คืนเงินลูกค้า (บาท)</label>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    max={totalPrice}
                                                    value={customAmountToUser}
                                                    onChange={(e) => handleCustomAmountToUserChange(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006664]/20 focus:border-[#006664]"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">คืนได้สูงสุด ฿{round2(totalPrice).toLocaleString('th-TH')}</p>
                                            </div>
                                            <div>
                                                <label className="text-[12px] font-bold text-slate-600 block mb-1">ปรับยอดวอลเลทแม่บ้าน (บาท)</label>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    value={customAmountToMaid}
                                                    onChange={(e) => setCustomAmountToMaid(e.target.value)}
                                                    placeholder="0 (ติดลบ = หัก)"
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006664]/20 focus:border-[#006664]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                เหตุผลที่ไม่ใช้นโยบายมาตรฐาน <span className="text-red-500 font-bold">*</span>
                                            </label>
                                            <textarea
                                                value={customReason}
                                                onChange={(e) => setCustomReason(e.target.value)}
                                                rows={2}
                                                placeholder="อธิบายเหตุผลสั้นๆ เพื่อบันทึกไว้อ้างอิงภายหลัง"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#006664]/20 focus:border-[#006664]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {decision === 'reject' && !isMaidReport && (
                            <div className="mt-3">
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                    เหตุผลที่แจ้งลูกค้า <span className="text-slate-400 font-medium">(ไม่บังคับ)</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    rows={2}
                                    placeholder="เช่น ตรวจสอบรูปก่อน-หลังแล้ว งานเรียบร้อยตามที่ระบุ"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#006664]/20 focus:border-[#006664]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex gap-3">
                        <Info className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                            {isMaidReport
                                ? 'เนื่องจากเป็นกรณีที่แม่บ้านแจ้งเข้ามา ระบบยังไม่มีบัญชีลูกค้า หลังยืนยันแล้วระบบจะแจ้งเตือนให้ลูกค้ากรอกบัญชีธนาคารก่อน เมื่อลูกค้ากรอกครบแล้วท่านจึงจะกดยืนยันโอนเงินคืนลูกค้าได้ที่การ์ดรายการจองนี้อีกครั้ง ส่วนยอดวอลเลทของแม่บ้านระบบจะอัปเดตให้ทันทีเมื่อท่านยืนยันรายการนี้'
                                : 'กรุณาดำเนินการโอนเงินคืนให้ลูกค้าผ่านบัญชีธนาคารด้านบนด้วยตนเอง เนื่องจากระบบยังไม่รองรับการโอนอัตโนมัติในส่วนนี้ ส่วนยอดวอลเลทของแม่บ้านระบบจะอัปเดตให้ทันทีเมื่อท่านยืนยันรายการ'}
                        </p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <button
                        onClick={handleSettle}
                        disabled={loading || !canSubmit}
                        className={`w-full py-4 rounded-2xl font-extrabold text-[15px] shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${(loading || !canSubmit) ? 'opacity-50 cursor-not-allowed' : ''} bg-[#006664] text-white shadow-[#006664]/20`}
                    >
                        {loading ? 'กำลังดำเนินการ...' : 'ยืนยันและอัปเดตระบบ'}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-widest">การกดยืนยันจะอัปเดตยอดเงินในวอลเลทของแม่บ้านทันที</p>
                </div>
            </div>
        </div>
    );
};

export default SettleDisputeModal;
