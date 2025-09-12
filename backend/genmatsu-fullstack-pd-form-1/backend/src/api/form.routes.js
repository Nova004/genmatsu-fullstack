// backend/src/api/form.routes.js
const { Router } = require('express');
const { getFormTemplateById } = require('../controllers/form.controller.js');

const router = Router();

// GET /api/forms/templates/:id
router.get('/forms/templates/:id', getFormTemplateById);

// TODO: เพิ่ม routes สำหรับการบันทึกข้อมูล

module.exports = router;