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

// ✅ Add Interceptor to inject token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
