// backend/src/api/report.routes.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");

// 1. ดึงข้อมูล Daily Report (สำหรับแสดงบนหน้าเว็บ)
router.get("/daily", reportController.getDailyProductionReport);

// 2. ✅ [ใหม่] ดาวน์โหลด Daily Report เป็น PDF
router.get("/daily/pdf", reportController.downloadDailyReportPdf);

// 3. จัดการข้อมูลสรุป/หมายเหตุ (Summary & Remarks)
router.get("/daily/summary", reportController.getDailySummary);
router.post("/daily/summary", reportController.saveDailySummary);

// 4. ✅ [ใหม่] ดาวน์โหลด Monthly Report เป็น Excel
router.get("/export-excel", reportController.downloadMonthlyExcel);

module.exports = router;
