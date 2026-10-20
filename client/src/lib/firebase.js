// นำเข้าฟังก์ชันสำหรับการเริ่มต้น (initialize) และตรวจสอบสถานะของแอป Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
// นำเข้าฟังก์ชันสำหรับใช้งานระบบยืนยันตัวตน (Authentication)
import { getAuth } from 'firebase/auth';

// 1. นำเข้าค่า Config ลับจากไฟล์ .env 
// (ต้องใช้ process.env.NEXT_PUBLIC_... เพื่อให้ฝั่งหน้าบ้านของ Next.js มองเห็นตัวแปรเหล่านี้)
// การทำแบบนี้เพื่อความปลอดภัย ไม่ให้รหัสลับหลุดไปอยู่บนหน้าเว็บแบบโจ่งแจ้ง
// หมายเหตุ: โปรเจคนี้ใช้ Vite (ไม่ใช่ Next.js) ค่าจึงอ่านผ่าน import.meta.env.VITE_... จากไฟล์ client/.env.local
// ตัวแปรที่ขึ้นต้นด้วย VITE_ เท่านั้นที่หน้าเว็บมองเห็น
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 2. เริ่มต้นระบบ Firebase อย่างปลอดภัย
// คำอธิบาย: !getApps().length หมายถึง "ถ้ายังไม่มีแอป Firebase ถูกสร้างไว้เลย" 
// ให้สร้างใหม่ด้วย initializeApp(firebaseConfig) แต่ถ้ามีอยู่แล้ว ให้ดึงแอปเดิมมาใช้ด้วย getApp()
// ป้องกันปัญหา Error: Firebase app already exists ใน Next.js ที่มีการโหลดหน้าเว็บซ้ำๆ
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. สร้างตัวแปร auth ซึ่งเปรียบเสมือน "เครื่องรูดบัตร" หรือ "ตัวจัดการการล็อกอิน"
const auth = getAuth(app);

// ส่งออก app และ auth เพื่อให้ไฟล์อื่นๆ (เช่น AuthScreen) เรียกใช้งานได้
export { app, auth };