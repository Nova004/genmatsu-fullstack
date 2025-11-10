// backend/src/api/approval.routes.js

const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approval.controller");
// (อาจจะต้องเพิ่ม Middleware ตรวจสอบสิทธิ์ (authMiddleware) ในอนาคต)

// 1. API สำหรับ "อ่าน" (GET)
// (เพื่อให้คอมโพเนนต์ของคุณดึง Flow ไปแสดง)
router.get("/flow/:submissionId", approvalController.getApprovalFlow);

// 2. API สำหรับ "กระทำ" (POST)
// (สำหรับให้หัวหน้ากด Approve / Reject)
router.post("/action", approvalController.performApprovalAction);

module.exports = router;