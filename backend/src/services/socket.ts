/// <reference types="vite/client" />
import { io } from 'socket.io-client';

// ใส่ URL ของ Backend คุณ (ถ้ารัน Localhost port 4000)
// ถ้าขึ้น Production ต้องเปลี่ยนเป็น IP หรือ Domain จริง
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'], // บังคับใช้ WebSocket เพื่อความเร็ว
  autoConnect: true,
});