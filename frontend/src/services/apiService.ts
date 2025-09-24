import axios from 'axios';

// สร้าง axios instance ขึ้นมา
// เราไม่ต้องกำหนด baseURL เพราะ Proxy ใน vite.config.js จะจัดการให้เอง
const apiClient = axios.create();

export default apiClient;