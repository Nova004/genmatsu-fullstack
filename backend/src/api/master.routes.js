// src/api/master.routes.js

const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');

// --- แก้ไขเส้นทางนี้ ให้มี /latest และเรียกใช้ฟังก์ชันใหม่ ---
router.get('/master/template/:template_name/latest', masterController.getLatestTemplateByName);

// (ในอนาคตเราจะเพิ่มเส้นทางสำหรับ getTemplateById ที่นี่)

module.exports = router;