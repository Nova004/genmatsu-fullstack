// src/api/master.routes.js

const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');

// --- แก้ไขเส้นทางนี้ ให้มี /latest และเรียกใช้ฟังก์ชันใหม่ ---
router.get('/template/:templateName/latest', masterController.getLatestTemplateByName);

router.get('/templates', masterController.getAllLatestTemplates);

// (ในอนาคตเราจะเพิ่มเส้นทางสำหรับ getTemplateById ที่นี่)

module.exports = router;