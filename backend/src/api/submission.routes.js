const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

router.post('/', submissionController.createSubmission);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการทั้งหมด" 🎯
router.get('/', submissionController.getAllSubmissions);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการเดียว" 🎯
router.get('/:id', submissionController.getSubmissionById);

module.exports = router;