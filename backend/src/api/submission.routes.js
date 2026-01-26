const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");
const reportController = require("../controllers/report.controller");

const validate = require("../middlewares/validation.middleware");
const { verifyToken } = require("../middlewares/auth.middleware"); // ✅ Import Auth Middleware
const submissionSchemas = require("../validators/submission.validator");


router.post(
  "/",
  validate(submissionSchemas.createSubmission),
  submissionController.createSubmission
);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการทั้งหมด" 🎯
router.get("/", submissionController.getAllSubmissions);

// 🎯 Route ใหม่: สำหรับ "ดึงรายการเดียว" 🎯
router.get("/pending-tasks", submissionController.getMyPendingTasks);
router.get("/my-messages", submissionController.getMyMessages);

router.put("/:id/st-plan", submissionController.updateStPlan);
// 2. เอาเส้นทางที่เป็นตัวแปร (Dynamic Route) ไว้ทีหลัง

// 🎯 Route ใหม่: สำหรับ "การลบ" 🎯
router.delete("/:id", verifyToken, submissionController.deleteSubmission);

router.get("/reports/daily", reportController.getDailyProductionReport);
router.get("/reports/summary", reportController.getDailySummary);

router.post("/reports/summary", reportController.saveDailySummary);
router.get("/reports/daily/pdf", reportController.downloadDailyReportPdf);

// PUT /api/submissions/:id - สำหรับอัปเดตข้อมูล submission
router.put(
  "/:id",
  verifyToken, // ✅ Add Middleware
  validate(submissionSchemas.updateSubmission),
  submissionController.updateSubmission
);
router.get("/print/:id", submissionController.generatePdf);
router.put("/resubmit/:id", verifyToken, submissionController.resubmitSubmission);
router.get("/:id", submissionController.getSubmissionById);

module.exports = router;
