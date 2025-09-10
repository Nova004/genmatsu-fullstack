// src/api/master.routes.js

const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');

// กำหนดเส้นทาง: GET /api/master/template/:template_name
// เมื่อมีคนเรียกมาที่ URL นี้ ให้ไปเรียกใช้ฟังก์ชัน getTemplateByName
router.get('/master/template/:template_name', masterController.getTemplateByName);

module.exports = router;