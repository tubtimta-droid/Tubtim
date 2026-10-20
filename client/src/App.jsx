
// นำเข้าเครื่องมือจาก React (useState ไว้เก็บข้อมูลตัวแปร, useEffect ไว้สั่งทำงานอัตโนมัติ)
import React, { useState, useEffect } from 'react';

// นำเข้า Component ต่างๆ ที่ใช้ประกอบร่างเป็นหน้าเว็บ
import ToastContainer from './components/ToastContainer'; // กล่องแจ้งเตือนมุมจอ
import ConfirmModal from './components/ConfirmModal'; // ป๊อปอัปถามยืนยัน (คุณแน่ใจหรือไม่?)
import Navbar from './components/Navbar'; // แถบเมนูด้านบน
import AuthScreen from './pages/AuthScreen'; // หน้าล็อกอิน
import UserView from './pages/user/UserView'; // หน้าของลูกค้า
import AdminView from './pages/admin/AdminView'; // หน้าของแอดมิน
import UserProfile from './pages/user/UserProfile'; // หน้าแก้ไขโปรไฟล์

export default function App() {
  // --- การสร้าง State (ตัวแปรที่ใช้แล้วหน้าจอจะรีเฟรชตาม) ---
  
  // เก็บข้อมูลผู้ใช้ที่กำลังล็อกอินอยู่ ถ้าเป็น null แปลว่ายังไม่ได้ล็อกอิน
  const [user, setUser] = useState(null);
  
  // view ใช้ควบคุมว่าจะให้หน้าจอโชว์ Component อะไร (ค่าเริ่มต้นคือ 'home')
  const [view, setView] = useState('home');
  // ใช้เช็คว่าระบบกำลังโหลดข้อมูลตอนเปิดเว็บครั้งแรกอยู่ไหม
  const [isInitializing, setIsInitializing] = useState(true);
  
  // เก็บข้อความแจ้งเตือน (Toast) เช่น "บันทึกสำเร็จ" เป็น Array เพราะเผื่อเด้งพร้อมกันหลายอัน
  const [toasts, setToasts] = useState([]);
  // เก็บการตั้งค่าข้อความของป๊อปอัปยืนยัน (ถ้ามีค่าคือโชว์ ถ้าเป็น null คือซ่อน)
  const [confirmConfig, setConfirmConfig] = useState(null);

  // ฟังก์ชันสำหรับเพิ่มข้อความแจ้งเตือนเข้าสู่ระบบ
  const addToast = (type, title, message) => {
      const id = Date.now(); // สร้างไอดีสุ่มด้วยเวลา
      // เอาของเดิมมา แล้วต่อท้ายด้วยกล่องข้อความใหม่
      setToasts(prev => [...prev, { id, type, title, message }]);
      // ตั้งเวลา 4 วินาที ให้ลบข้อความนี้ทิ้งอัตโนมัติ (เด้งแล้วหายไป)
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  
  // ฟังก์ชันกดกากบาทปิด Toast ด้วยตัวเอง
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ฟังก์ชันใช้สำหรับเรียกป๊อปอัป "ยืนยันการกระทำ" (เช่น ถามก่อนลบ)
  const triggerConfirm = (title, message, onConfirm, type = 'warning') => {
      setConfirmConfig({ title, message, onConfirm, type });
  };

  // ==========================================
  // ระบบจดจำการล็อกอิน (Gatekeeper) ทำงานอัตโนมัติครั้งแรกที่เข้าเว็บ
  // ==========================================
  useEffect(() => {
    // 1. ไปควานหาข้อมูลในคลังเก็บข้อมูลของเบราว์เซอร์ (Local Storage) ว่าเคยล็อกอินค้างไว้ไหม
    const storedUser = localStorage.getItem('ku_maid_user');
    if (storedUser) {
        try {
            // แปลงข้อมูลข้อความ กลับเป็น Object
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser); // จับยัดลงตัวแปร User เพื่อให้ระบบรู้ตัว
            
            // 2. ตรวจสอบ Role (ตำแหน่ง) 
            // ถ้าเป็นแอดมิน ให้ดีดไปหน้า view = 'admin' อัตโนมัติ
            if (parsedUser.role === 'admin') setView('admin');
            else setView('home'); // ถ้าไม่ใช่ ให้ไปหน้า 'home' ปกติ
        } catch (e) {
            // ถ้าข้อมูลใน LocalStorage พัง (เช่น มีคนไปแก้เล่น) ให้ลบทิ้ง
            console.error("Error parsing user", e);
            localStorage.removeItem('ku_maid_user');
        }
    }
    // เลิกโหลด โชว์หน้าเว็บได้
    setIsInitializing(false);
  }, []); // [] ด้านหลังแปลว่า ให้ทำงานแค่รอบเดียวตอนรีเฟรชหน้าเว็บ

  // ฟังก์ชันนี้ถูกเรียกใช้เมื่อหน้า AuthScreen ทำการล็อกอินสำเร็จ
  const handleLogin = (u) => { 
      setUser(u); // บันทึก user ลง State
      localStorage.setItem('ku_maid_user', JSON.stringify(u)); // บันทึกข้อมูลลงเครื่องผู้ใช้ เพื่อจำการล็อกอินข้ามวัน
      
      // ล็อกอินเสร็จ เช็ค Role เพื่อพาไปหน้าให้ถูกต้อง
      if (u.role === 'admin') setView('admin');
      else setView('home'); 
  };
  
  // ฟังก์ชันออกจากระบบ
  const handleLogout = () => { 
      setUser(null); // เคลียร์ State
      localStorage.removeItem('ku_maid_user'); // ลบข้อมูลในเครื่องทิ้ง
      setView('home'); // กลับไปหน้าแรก (ซึ่งก็จะติดด่านหน้า AuthScreen ต่อไป)
  };

  // ถ้ากำลังประมวลผลเช็คการล็อกอินครั้งแรก ให้โชว์คำว่า Loading...
  if (isInitializing) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-400">Loading...</div>;

  return (
    // โครงสร้างหลักของแอปพลิเคชัน
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 selection:bg-[#006664]/20 selection:text-[#006664] relative">
      
      {/* ใส่ Component สำหรับแจ้งเตือนต่างๆ ให้ลอยอยู่เหนือทุกสิ่ง */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmModal 
        isOpen={!!confirmConfig} // จะเปิดเมื่อตัวแปร confirmConfig ไม่ใช่ null
        title={confirmConfig?.title} 
        message={confirmConfig?.message} 
        type={confirmConfig?.type}
        onConfirm={() => { confirmConfig.onConfirm(); setConfirmConfig(null); }} // ถ้ากดตกลง ให้รันคำสั่ง แล้วปิดป๊อปอัป
        onCancel={() => setConfirmConfig(null)} // ถ้ากดยกเลิก ก็ปิดป๊อปอัปทิ้ง
      />

      {/* ถ้าผู้ใช้ล็อกอินแล้ว (user ไม่ใช่ null) ถึงจะโชว์แถบเมนูด้านบน (Navbar) */}
      {user && (
        <Navbar 
            user={user} 
            onLogout={handleLogout} 
            onProfileClick={() => setView('profile')} 
            currentView={view} // ส่งสถานะหน้าปัจจุบันไปให้ Navbar รู้
            onViewChange={setView} // ส่งรีโมทเปลี่ยนหน้าไปให้ Navbar สั่งงานได้
        />
      )}
      
      {/* ==========================================
          ระบบควบคุมหน้าจอ (Router Logic)
          ========================================== */}
      
      {/* 1. ถ้ายังไม่มี user (ยังไม่ล็อกอิน) -> แสดงหน้า AuthScreen ให้ล็อกอิน */}
      {!user ? (
          <AuthScreen onLoginSuccess={handleLogin} notify={addToast} />
      ) 
      
      /* 2. ถ้าล็อกอินแล้ว และ State 'view' คือ 'admin' หรือ ผู้ใช้เป็นแอดมิน -> แสดงหน้า AdminView */
      : (view === 'admin' || user.role === 'admin') && view !== 'profile' ? (
          <AdminView notify={addToast} requestConfirm={triggerConfirm} />

      /* 3. ถ้าล็อกอินแล้ว และ State 'view' คือ 'profile' -> แสดงหน้าแก้ไขข้อมูล */
      ) : view === 'profile' ? (
          <UserProfile 
              user={user} 
              // ฟังก์ชันอัปเดตข้อมูล ถ้าผู้ใช้แก้ข้อมูลส่วนตัว ให้สั่งอัปเดต State หลัก และ LocalStorage ทันที
              updateUserState={(newUser) => {
                  setUser(newUser);
                  localStorage.setItem('ku_maid_user', JSON.stringify(newUser));
              }} 
              notify={addToast} 
              onBack={() => setView(user?.role === 'admin' ? 'admin' : 'home')} // กดกลับไปหน้าโฮม หรือแอดมิน
          />
          
      /* 4. ถ้าไม่ใช่หน้าพิเศษด้านบนเลย ให้โชว์ UserView (หน้าจองแม่บ้าน) เป็นหลัก */
      ) : (
          <UserView 
              user={user} 
              // ถ้า view เป็นชื่อแท็บของลูกค้า (home, booking, history) ให้ส่งค่านั้นไป ถ้าไม่ใช่ บังคับเป็น home
              activeTab={['home', 'booking', 'history'].includes(view) ? view : 'home'} 
              setActiveTab={setView} // ส่งรีโมทให้ UserView สั่งเปลี่ยนหน้าเองได้ด้วย
              notify={addToast} 
              requestConfirm={triggerConfirm} 
          />
      )}
    </div>
  );
}