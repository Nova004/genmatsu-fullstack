const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

router.post('/', submissionController.createSubmission);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการทั้งหมด" 🎯
router.get('/', submissionController.getAllSubmissions);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการเดียว" 🎯
router.get('/:id', submissionController.getSubmissionById);

// 🎯 Route ใหม่: สำหรับ "การลบ" 🎯
router.delete('/:id', submissionController.deleteSubmission);

// PUT /api/submissions/:id - สำหรับอัปเดตข้อมูล submission
router.put('/:id', submissionController.updateSubmission);

router.get('/print/:id', submissionController.generatePdf);

module.exports = router;