// src/api/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// กำหนดเส้นทาง: GET /api/users/:id
// เมื่อมีคนเรียกมาที่ URL นี้ ให้ไปเรียกใช้ฟังก์ชัน findUserById
router.get('/users/:id', userController.findUserById);

module.exports = router;