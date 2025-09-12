// backend/src/config/db.config.js

// โหลดค่าจากไฟล์ .env ที่ root ของ backend เข้ามาใน process.env
require('dotenv').config();

// Export object config สำหรับฐานข้อมูล (เหมือนเดิม)
module.exports = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};