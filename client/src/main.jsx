import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// StrictMode = โหมดตรวจสอบตอนพัฒนา ช่วยเตือนโค้ดที่อาจมีปัญหา (ไม่มีผลกับผู้ใช้จริง)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
