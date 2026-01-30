// frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/genmatsu/',
  server: {
    port: 5173,
    open: '/genmatsu/', // เปิดมาให้เด้งเข้าหน้านี้เลย
    proxy: {
      '/genmatsu/api': {
        target: 'http://localhost:4000', // Backend เครื่องเรา
        changeOrigin: true,
        ws: true, // ✅ รองรับ WebSocket (แก้ปัญหา 400 Bad Request)
        rewrite: (path) => path.replace(/^\/genmatsu\/api/, '/api'), // ตัด path ทิ้งให้เหลือแค่ /api
      },
    },
  },
  // ✅ เพิ่มส่วนนี้เพื่อจูนประสิทธิภาพตอน Build
  build: {
    chunkSizeWarningLimit: 1000, // เพิ่มลิมิตการแจ้งเตือนไฟล์ใหญ่ (Optional)
    rollupOptions: {
      output: {
        // แยกไฟล์ไลบรารี (Vendor) ออกจากโค้ดหลัก
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true, // 👈 ทำให้เราใช้ describe, it, expect ได้เลย (เหมือน Jest)
    environment: 'jsdom', // 👈 บอกให้ใช้เบราว์เซอร์จำลอง
    setupFiles: './src/setupTests.ts', // (เดี๋ยวเราจะสร้างไฟล์นี้)
  },
});
