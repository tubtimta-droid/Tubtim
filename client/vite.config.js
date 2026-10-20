import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // โหลดไลบรารีเหล่านี้ล่วงหน้าตอนเปิด dev server ให้เปิดหน้าเว็บเร็วขึ้น
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'react',
      'react-dom',
      'axios',
      'lucide-react'
    ]
  },
  server: {
    // หน้าเว็บรันที่ http://localhost:3000
    port: 3000,
    // อนุญาตให้เปิดผ่านลิงก์ ngrok (ทดสอบบนมือถือ) ไม่งั้น Vite จะบล็อกชื่อโดเมนที่ไม่รู้จัก
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app'],
    proxy: {
      // /api/... → ส่งต่อไปที่ backend (server/server.js)
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      // /backend-images/uploads/... → รูปที่อัปโหลดไว้ใน server/uploads (ตัดคำว่า /backend-images ออกก่อนส่งต่อ)
      '/backend-images': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend-images/, '')
      }
    }
  }
});
