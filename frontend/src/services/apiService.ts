import axios from 'axios';

// สร้าง axios instance ขึ้นมา
// เราไม่ต้องกำหนด baseURL เพราะ Proxy ใน vite.config.js จะจัดการให้เอง
const apiClient = axios.create({
    // ✅ ใช้ Path เต็มไปเลย (เดี๋ยว Vite Proxy ในข้อ 1 จะจัดการต่อให้เอง)
    baseURL: '/genmatsu/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;