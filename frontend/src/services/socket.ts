import { io } from 'socket.io-client';

// ไม่ต้อง Force URL แล้ว ให้มันใช้ Relative Path (ตาม Domain/Port ปัจจุบัน)
// Fallback to polling if WebSocket fails (Best for strict firewalls/IIS)
export const socket = io({
  path: '/genmatsu/api/socket.io',
  transports: ['polling', 'websocket'], // 👈 ลองใช้ Polling ก่อน (ช้ากว่านิดหน่อยแต่ทะลุทุก Firewall)
  autoConnect: true,
});
