import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ deadline, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    // hasFired กันไม่ให้เรียก onExpire ซ้ำหลายรอบ
    const hasFired = useRef(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = new Date(deadline).getTime() - now;

            if (distance <= 0) {
                setTimeLeft('หมดเวลาชำระเงิน');
                setIsUrgent(true);

                if (!hasFired.current) {
                    hasFired.current = true;
                    onExpire();
                }
                return false; // return false to indicate interval should be cleared
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours} ชม. ${minutes} นาที ${seconds} วินาที`);
                setIsUrgent(false);
            } else {
                setTimeLeft(`${minutes} นาที ${seconds} วินาที`);
                setIsUrgent(true);
            }
            return true;
        };

        // เรียกทันที 1 ครั้ง จะได้ไม่ต้องรอ 1 วินาทีกว่าตัวเลขและสีจะขึ้นถูกต้อง
        const shouldContinue = updateTimer();
        
        if (shouldContinue) {
            const interval = setInterval(() => {
                if (!updateTimer()) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [deadline, onExpire]);

    return (
        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12px] font-bold tracking-wide border shadow-sm transition-all duration-300 ${isUrgent ? 'bg-rose-50/80 text-rose-600 border-rose-200 shadow-rose-100/40' : 'bg-orange-50/80 text-orange-600 border-orange-200 shadow-orange-100/40'}`}>
            <Timer size={14} className={isUrgent ? 'animate-pulse text-rose-500' : 'text-orange-500'} strokeWidth={2.5} />
            {timeLeft !== 'หมดเวลาชำระเงิน' ? `ชำระเงินภายใน: ${timeLeft}` : 'หมดเวลาชำระเงิน'}
        </div>
    );
};

export default CountdownTimer;
