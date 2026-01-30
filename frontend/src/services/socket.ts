import { io } from 'socket.io-client';

// ไม่ต้อง Force URL แล้ว ให้มันใช้ Relative Path (ตาม Domain/Port ปัจจุบัน)
// Fallback to polling if WebSocket fails (Best for strict firewalls/IIS)
export const socket = io({
  path: '/genmatsu/api/socket.io',
  transports: ['polling'], // 👈 กลับมาใช้ Polling ตามเดิม (ไม่ต้องแก้ Server)
  autoConnect: true,
});
