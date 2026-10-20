import { useEffect } from 'react';

// นับจำนวนป็อปอัพที่เปิดอยู่พร้อมกัน (module-level) เพื่อไม่ให้ป็อปอัพหนึ่งปิดแล้วดันคืน scroll
// ทั้งที่ยังมีอีกป็อปอัพซ้อนอยู่ด้านบน (เช่น การ์ดจองเปิดป็อปอัพย่อยซ้อนโมดัลใหญ่)
let lockCount = 0;

const useLockBodyScroll = (active = true) => {
    // ทำงานเมื่อ active เปลี่ยน: เปิดป๊อปอัป → ล็อก, ปิดป๊อปอัป (cleanup) → ปลดล็อกเมื่อไม่มีป๊อปอัปเหลือ
    useEffect(() => {
        if (!active) return undefined;

        if (lockCount === 0) {
            document.body.style.overflow = 'hidden';
        }
        lockCount++;

        return () => {
            lockCount--;
            if (lockCount === 0) {
                document.body.style.overflow = 'unset';
            }
        };
    }, [active]);
};

export default useLockBodyScroll;
