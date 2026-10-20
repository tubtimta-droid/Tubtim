import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Check } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';

import BookingSummary from './BookingSummary';
import { SERVICE_ZONE_META } from './bookingConstants';
import BookingStepLocation from './booking-steps/BookingStepLocation';
import BookingStepServices from './booking-steps/BookingStepServices';
import BookingStepDetails from './booking-steps/BookingStepDetails';

const UserBookingTab = ({ user, onSuccess }) => {
    // ขั้นตอนที่กำลังทำอยู่ (1, 2, 3)
    const [currentStep, setCurrentStep] = useState(1);

    // ขั้นที่ 1: สถานที่ (รายชื่ออาคารและห้องดึงจากฐานข้อมูล)
    const [dormBuildings, setDormBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState('');

    // ขั้นที่ 2: บริการ
    const [serviceZones, setServiceZones] = useState([]);
    const [selectedZones, setSelectedZones] = useState([]);
    const [expandedZoneId, setExpandedZoneId] = useState(null);

    // ขั้นที่ 3: วันเวลาและรายละเอียด
    const [form, setForm] = useState({
        date: '',
        phone: user?.phone || '',
        note: '',
    });
    const [errors, setErrors] = useState({});

    // Map Feature (แผนที่)
    // โหลดสคริปต์ Google Maps ด้วย API key จาก .env (VITE_GOOGLE_MAPS_API_KEY) · defaultCenter = จุดเริ่มต้นของแผนที่
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    });
    const defaultCenter = { lat: 17.2882, lng: 104.1118 };
    const [mapPin, setMapPin] = useState(null);

    // ดึงรายชื่ออาคาร/หอพักและห้องจากฐานข้อมูล
    useEffect(() => {
        axios
            .get('/api/dorm-buildings')
            .then((res) => setDormBuildings(res.data))
            .catch((err) => console.error('Failed to load dorm buildings:', err));
    }, []);

    // ดึงข้อมูลบริการจากฐานข้อมูล (ราคาจริง) แล้วรวมกับข้อมูล UI (ไอคอน, คำอธิบาย)
    useEffect(() => {
        axios
            .get('/api/service-zones')
            .then((res) => {
                const merged = res.data.map((row) => {
                    const meta = SERVICE_ZONE_META[row.zone_id] || {
                        icon: null,
                        details: [],
                    };
                    return {
                        id: row.zone_id,
                        label: row.zone_name,
                        icon: meta.icon,
                        studentPrice: Number(row.student_price),
                        staffPrice: Number(row.staff_price),
                        isAddon: row.is_addon === 1,
                        warning: meta.warning,
                        details: meta.details,
                    };
                });
                setServiceZones(merged);
            })
            .catch((err) => console.error('Failed to load service zones:', err));
    }, []);

    // ค่าที่คำนวณจาก state ข้างบน
    // ประเภทหอ (student/staff) ได้จากอาคารที่เลือก ใช้ตัดสินว่าใช้ราคาไหน · รายการห้องของอาคารนั้น
    const dormType = selectedBuilding?.dormType || 'student';
    const rooms = useMemo(() => selectedBuilding?.rooms || [], [selectedBuilding]);

    // ดึงราคาตามประเภทหอพัก (นิสิต/อาจารย์)
    const getPrice = (zone) => (dormType === 'staff' ? zone.staffPrice : zone.studentPrice);

    // ยอดรวม = ราคาของทุกโซนที่เลือก (ใช้แสดงผล — ราคาจริงตอนบันทึก backend คำนวณเอง)
    const totalPrice = useMemo(() => {
        return selectedZones.reduce((sum, zoneId) => {
            const zone = serviceZones.find((z) => z.id === zoneId);
            if (!zone) return sum;
            return sum + (dormType === 'staff' ? zone.staffPrice : zone.studentPrice);
        }, 0);
    }, [selectedZones, serviceZones, dormType]);

    // สร้างข้อความสถานที่
    // ประกอบข้อความสถานที่ เช่น "หอพักนนทรี ชั้น 2 ห้อง N203" (ใช้แสดงสรุปก่อนจอง ไม่ได้ส่งไปบันทึก)
    const buildLocationString = () => {
        if (!selectedBuilding || !selectedRoom) return '';
        const roomObj = rooms.find((r) => r.room === selectedRoom);
        if (!roomObj) return '';
        return `${selectedBuilding.label} ชั้น ${roomObj.floor} ห้อง ${selectedRoom}`;
    };

    // จำกัดจำนวนโซนบริการที่เลือกได้ต่อการจอง
    const MAX_ZONES = 4;

    // กดเลือก/ยกเลิกโซนบริการ (ถ้าครบ 4 แล้ว เลือกเพิ่มไม่ได้)
    const toggleZone = (id) => {
        setSelectedZones((prev) => {
            if (prev.includes(id)) {
                return prev.filter((z) => z !== id);
            }
            if (prev.length >= MAX_ZONES) {
                return prev;
            }
            return [...prev, id];
        });
    };

    const isMaxReached = selectedZones.length >= MAX_ZONES;

    // เลื่อนหน้าไปที่ช่องที่กรอกผิด
    const scrollToError = (fieldId) => {
        const el = document.getElementById(fieldId);
        if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // กด "ถัดไป": ตรวจข้อมูลของขั้นปัจจุบันก่อน ถ้าครบจึงไปขั้นถัดไป
    const handleNextStep = () => {
        setErrors({});
        if (currentStep === 1) {
            if (!selectedBuilding) {
                setErrors({ building: 'กรุณาเลือกหอพัก' });
                scrollToError('field-building');
                return;
            }
            if (!selectedRoom) {
                setErrors({ room: 'กรุณาเลือกเลขห้อง' });
                scrollToError('field-room');
                return;
            }
            setCurrentStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentStep === 2) {
            if (selectedZones.length === 0) {
                setErrors({ zones: 'กรุณาเลือกบริการอย่างน้อย 1 รายการ' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            setCurrentStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // กด "ย้อนกลับ" ไปขั้นก่อนหน้า
    const handleBackStep = () => {
        setErrors({});
        setCurrentStep((prev) => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // กด "ยืนยันการจอง" (ขั้นที่ 3): ตรวจวันเวลาและเบอร์โทร แล้วส่งข้อมูลทั้งหมดไปที่ POST /api/bookings
    // เงื่อนไขจองล่วงหน้า 3 ชม.: (เวลาที่จอง − เวลาปัจจุบัน) เป็นมิลลิวินาที ÷ (1000×60×60) = จำนวนชั่วโมง
    const submitBookingFinal = async () => {
        setErrors({});
        let step3Errors = {};
        if (!form.date) {
            step3Errors.date = 'กรุณาระบุวันและเวลา';
        } else {
            const diffInHours = (new Date(form.date).getTime() - new Date().getTime()) / (1000 * 60 * 60);
            if (diffInHours < 3) step3Errors.date = 'ต้องจองล่วงหน้าอย่างน้อย 3 ชั่วโมง';
        }
        if (!form.phone || form.phone.length !== 10) step3Errors.phone = 'กรุณากรอกเบอร์โทรให้ครบ 10 หลัก';

        if (Object.keys(step3Errors).length > 0) {
            setErrors(step3Errors);
            if (step3Errors.date) scrollToError('field-date');
            else if (step3Errors.phone) scrollToError('field-phone');
            return;
        }

        try {
            await axios.post('/api/bookings', {
                user_id: user.user_id,
                room_id: rooms.find((r) => r.room === selectedRoom)?.id,
                zones: selectedZones,
                date: form.date,
                customer_phone: form.phone,
                customer_note: form.note,
                lat: mapPin?.lat || null,
                lng: mapPin?.lng || null,
            });
            onSuccess();
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่');
            console.error(err);
        }
    };

    // เวลาที่เร็วที่สุดที่เลือกได้ในปฏิทิน = ตอนนี้ + 3 ชม. (ปรับ timezone ให้เป็นเวลาไทยก่อนแปลงเป็นข้อความ)
    const getMinDateTime = () => {
        const now = new Date();
        now.setHours(now.getHours() + 3);
        const tzOffset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    // เมื่อเปลี่ยนหอพัก ให้ล้างห้องที่เลือก บริการที่เลือก และการ์ดบริการที่กางอยู่ (เพราะห้องและราคาเปลี่ยนตามหอ)
    useEffect(() => {
        setSelectedRoom('');
        setSelectedZones([]);
        setExpandedZoneId(null);
    }, [selectedBuilding]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-right-4 duration-300 pb-28 lg:pb-0">
            {/* ================= คอลัมน์ซ้าย (ขั้นตอนการจอง) ================= */}
            <div className="lg:col-span-8 space-y-6 lg:space-y-8 mt-4 md:mt-0">
                {/* แถบแสดงขั้นตอน 1-2-3 */}
                <div className="mb-8 sm:mb-10 w-full bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100/80 px-5 sm:px-8 py-5 sm:py-6">
                    <div className="flex items-center justify-between relative">
                        {[
                            { label: 'สถานที่', step: 1 },
                            { label: 'บริการ', step: 2 },
                            { label: 'วันเวลา', step: 3 },
                        ].map((s, i) => (
                            <React.Fragment key={s.step}>
                                {i > 0 && (
                                    <div className="flex-1 h-[3px] mx-2 sm:mx-4 relative z-0">
                                        <div className="absolute inset-0 bg-slate-100 rounded-full"></div>
                                        <div
                                            className={`absolute left-0 top-0 h-full bg-gradient-to-r from-[#006664] to-[#00807D] rounded-full transition-all duration-700 ease-in-out ${currentStep >= s.step ? 'w-full' : 'w-0'}`}
                                        ></div>
                                    </div>
                                )}
                                <div className="flex flex-col items-center z-10 shrink-0 gap-2">
                                    <div
                                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-500 ${currentStep > s.step ? 'bg-[#006664] text-white shadow-[0_4px_12px_rgba(0,102,100,0.25)]' : currentStep === s.step ? 'bg-[#006664] text-white shadow-[0_4px_15px_rgba(0,102,100,0.3)] ring-4 ring-[#006664]/10' : 'bg-slate-50 text-slate-400 border-2 border-slate-200'}`}
                                    >
                                        {currentStep > s.step ? <Check size={16} strokeWidth={3} /> : s.step}
                                    </div>
                                    <span
                                        className={`text-[12px] sm:text-[13px] font-bold whitespace-nowrap transition-colors ${currentStep >= s.step ? 'text-[#006664]' : 'text-slate-400'}`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* ==================== ขั้นที่ 1: สถานที่ ==================== */}
                {currentStep === 1 && (
                    <BookingStepLocation 
                        dormBuildings={dormBuildings}
                        selectedBuilding={selectedBuilding}
                        setSelectedBuilding={setSelectedBuilding}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                        rooms={rooms}
                        errors={errors}
                        setErrors={setErrors}
                        isLoaded={isLoaded}
                        mapPin={mapPin}
                        setMapPin={setMapPin}
                        defaultCenter={defaultCenter}
                    />
                )}

                {/* ==================== ขั้นที่ 2: บริการ ==================== */}
                {currentStep === 2 && (
                    <BookingStepServices 
                        serviceZones={serviceZones}
                        selectedZones={selectedZones}
                        expandedZoneId={expandedZoneId}
                        setExpandedZoneId={setExpandedZoneId}
                        dormType={dormType}
                        selectedBuilding={selectedBuilding}
                        MAX_ZONES={MAX_ZONES}
                        isMaxReached={isMaxReached}
                        toggleZone={toggleZone}
                        getPrice={getPrice}
                    />
                )}

                {/* ==================== ขั้นที่ 3: วันเวลาและรายละเอียด ==================== */}
                {currentStep === 3 && (
                    <BookingStepDetails 
                        form={form}
                        setForm={setForm}
                        errors={errors}
                        setErrors={setErrors}
                        getMinDateTime={getMinDateTime}
                        buildLocationString={buildLocationString}
                        selectedZones={selectedZones}
                        serviceZones={serviceZones}
                    />
                )}
            </div>

            <BookingSummary
                selectedBuilding={selectedBuilding}
                selectedRoom={selectedRoom}
                locationString={buildLocationString()}
                selectedZones={selectedZones}
                serviceZones={serviceZones}
                dormType={dormType}
                totalPrice={totalPrice}
                submitBooking={submitBookingFinal}
                currentStep={currentStep}
                onNext={handleNextStep}
                onBack={handleBackStep}
                form={form}
            />
        </div>
    );
};

export default UserBookingTab;
