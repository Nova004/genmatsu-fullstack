import { io } from 'socket.io-client';

// ไม่ต้อง Force URL แล้ว ให้มันใช้ Relative Path (ตาม Domain/Port ปัจจุบัน)
// Fallback to polling if WebSocket fails (Best for strict firewalls/IIS)
export const socket = io({
  path: '/genmatsu/api/socket.io',
  transports: ['polling'], // 👈 ใช้ Polling อย่างเดียวเลย (ตัด Websocket ทิ้ง 100% เพื่อไม่ให้มี Error แดง)
  autoConnect: true,
});
