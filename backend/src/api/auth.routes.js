// backend/src/api/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // 1. Import Controller

// 2. กำหนดว่าถ้ามี POST request มาที่ /login ให้ไปเรียกฟังก์ชัน login ใน Controller
router.post('/login', authController.login);

// สามารถเพิ่ม route อื่นๆ ได้ เช่น register
// router.post('/register', authController.register);

module.exports = router;