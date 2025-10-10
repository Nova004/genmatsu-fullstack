// frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 👇 การตั้งค่า Proxy อยู่ตรงนี้
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // <<== เป้าหมายคือ Backend Server
        changeOrigin: true,
      },
    },
  },
});