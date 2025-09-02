// backend/src/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./api/auth.routes'); // 1. Import ไฟล์ route

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 1. เกี่ยวกับ api ให้ส่งไปที่ /api/auth
app.use('/api', authRoutes);



app.get('/', (req, res) => {
  res.send('Hello from organized Backend!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});