import axios from 'axios';
import { fireToast } from '../hooks/fireToast';

// สร้าง axios instance ขึ้นมา
// เราไม่ต้องกำหนด baseURL เพราะ Proxy ใน vite.config.js จะจัดการให้เอง
const apiClient = axios.create({
  baseURL: '/genmatsu/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request Interceptor: Inject Token
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

// ✅ Response Interceptor: Handle 401 (Token Expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('[API] 401 Unauthorized - Session Expired');

      // 1. Clear LocalStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 2. Prevent infinite loop if already on login page
      if (!window.location.pathname.includes('/genmatsu/auth/signin')) {
        // 3. Notify User
        fireToast('error', 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');

        // 4. Redirect to Login (using window.location to force full refresh)
        setTimeout(() => {
          window.location.href = '/genmatsu/auth/signin';
        }, 1500);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
