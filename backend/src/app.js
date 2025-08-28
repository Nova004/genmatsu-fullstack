// backend/src/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./api/auth.routes'); // 1. Import ไฟล์ route

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 2. บอก Express ให้ใช้ Route ที่เราสร้าง
// ทุก URL ที่ขึ้นต้นด้วย /api/auth ให้วิ่งไปหา authRoutes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello from organized Backend!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});