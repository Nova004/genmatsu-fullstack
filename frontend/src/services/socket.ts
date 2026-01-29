import { io } from 'socket.io-client';

// ไม่ต้อง Force URL แล้ว ให้มันใช้ Relative Path (ตาม Domain/Port ปัจจุบัน)
export const socket = io({
  path: '/genmatsu/api/socket.io', // ✅ ยิงไปที่ Path นี้เพื่อให้ Proxy ส่งต่อเข้า Backend ได้ถูกช่อง
  transports: ['websocket', 'polling'], // เพิ่ม polling เผื่อ websocket โดยบล็อก
  autoConnect: true,
});
