// controllers/submission.controller.js
const submissionService = require("../services/submission.service");
const pdfService = require("../services/pdf.service");

exports.createSubmission = async (req, res) => {
  const { formType, lotNo, templateIds, formData } = req.body;

  // 1. Validate พื้นฐาน
  if (!formType || !lotNo || !templateIds || !formData) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    // ✅ 2. [เพิ่มใหม่] ตรวจสอบ Lot No ซ้ำ
    const isDuplicate = await submissionService.checkLotNoExists(lotNo);

    if (isDuplicate) {
      // ถ้าซ้ำ ให้ส่ง Error 409 (Conflict) กลับไป
      return res.status(409).send({
        message: `Lot No: ${lotNo} มีอยู่ในระบบแล้ว กรุณาตรวจสอบใหม่อีกครั้ง`,
        errorCode: "DUPLICATE_LOT",
      });
    }

    // 3. ถ้าไม่ซ้ำ ก็บันทึกตามปกติ
    const submittedBy = req.user ? req.user.id : req.body.submittedBy;
    const submissionId = await submissionService.createSubmission({
      formType,
      lotNo,
      templateIds,
      formData,
      submittedBy,
    });

    // Notify clients about new submission
    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", lotNo: lotNo });
    }

    res.status(201).send({
      message: "Form submitted successfully!",
      submissionId: submissionId,
    });
  } catch (error) {
    console.error("Error creating submission:", error.message);
    res
      .status(500)
      .send({ message: "เกิดข้อผิดพลาดที่ Server", error: error.message });
  }
};

// ฟังก์ชันสำหรับอัปเดตเฉพาะค่า ST. Plan (Inline Edit)
exports.updateStPlan = async (req, res) => {
  try {
    const { id } = req.params; // submission_id
    const { st_target_value } = req.body; // ค่าใหม่

    // เรียกใช้ Service แทนการเขียน SQL เอง
    await submissionService.updateStPlan(id, st_target_value);

    res.json({ message: "ST. Plan updated successfully" });
  } catch (error) {
    console.error("Update ST Plan Error:", error);
    res.status(500).json({
      message: "Error updating ST. Plan",
      error: error.message,
    });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const { page, pageSize, search, startDate, endDate, status, formType, category, user } = req.query;

    const result = await submissionService.getAllSubmissions({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      search,
      startDate,
      endDate,
      status,
      formType,
      category,
      user // ✅ Pass User filter
    });

    res.status(200).send(result);
  } catch (err) {
    console.error("!!! ERROR in getAllSubmissions:", err);
    res
      .status(500)
      .send({ message: "Failed to retrieve submissions.", error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await submissionService.getSubmissionById(id);
    res.status(200).send(data);
  } catch (err) {
    if (err.message === "Submission not found.") {
      return res.status(404).send({ message: "Submission not found." });
    }
    res.status(500).send({
      message: "Failed to retrieve submission details.",
      error: err.message,
    });
  }
};

exports.deleteSubmission = async (req, res) => {
  const { id } = req.params;
  console.log(`[Controller] deleteSubmission called for ID: ${id}`);

  try {
    const userId = req.user ? req.user.id : "System"; // Fallback to System if no user
    const isDeleted = await submissionService.deleteSubmission(id, userId);
    console.log(`[Controller] isDeleted result: ${isDeleted}`);

    if (!isDeleted) {
      console.log(`[Controller] Submission not found, returning 404`);
      return res
        .status(404)
        .send({ message: `Submission with ID ${id} not found.` });
    }

    if (req.io) {
      console.log(`[Controller] Emitting 'refresh_data' socket event for deleted ID: ${id}`);
      req.io.emit("server-action", { action: "refresh_data", deletedId: id });
    } else {
      console.warn(`[Controller] req.io is undefined!`);
    }

    res
      .status(200)
      .send({ message: `Submission ID ${id} has been deleted successfully.` });
  } catch (err) {
    console.error(`[Controller] Error in deleteSubmission:`, err);
    res
      .status(500)
      .send({ message: "Failed to delete submission.", error: err.message });
  }
};

exports.updateSubmission = async (req, res) => {
  const { id } = req.params;
  const { lot_no, form_data } = req.body;

  if (!lot_no || !form_data) {
    return res.status(400).send({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const userId = req.user ? req.user.id : "System";
    await submissionService.updateSubmission(id, lot_no, form_data, userId);

    // Notify clients about update
    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", lotNo: lot_no });
    }

    res.status(200).send({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
      error: error.message,
    });
  }
};

exports.generatePdf = async (req, res) => {
  const { id } = req.params;

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173/genmatsu";

  const frontendPrintUrl = `${baseUrl}/reports/print/${id}`;

  try {
    const pdfBuffer = await pdfService.generatePdf(id, frontendPrintUrl);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=report-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    if (error.message.includes("Submission not found")) {
      return res.status(404).send({
        message: `Failed to generate PDF: Submission ID ${id} not found.`,
      });
    }
    res
      .status(500)
      .send({ message: "Failed to generate PDF", error: error.message });
  }
};

exports.resubmitSubmission = async (req, res) => {
  const { id } = req.params;
  const { formDataJson } = req.body;

  try {
    const userId = req.user ? req.user.id : "System";
    await submissionService.resubmitSubmission(id, formDataJson, userId);

    if (req.io) {
      console.log(`[Controller] Emitting 'refresh_data' for resubmitted ID: ${id}`);
      req.io.emit("server-action", { action: "refresh_data", resubmittedId: id });
    }

    res.status(200).json({ message: "Resubmitted successfully." });
  } catch (error) {
    console.error("Error resubmitting submission:", error);
    res
      .status(500)
      .json({ message: "Failed to resubmit", error: error.message });
  }
};

exports.getMyPendingTasks = async (req, res) => {
  try {
    // รับค่า level และ userId มาจาก Query String
    const { level, userId } = req.query;

    if (!level) {
      return res.status(400).json({ message: "User Level is required" });
    }

    // เรียก Service ที่เราทำไว้ก่อนหน้านี้ (ส่ง userId ไปด้วย)
    const tasks = await submissionService.getMyPendingTasks(parseInt(level), userId);

    // ส่งข้อมูลกลับไปให้ Frontend
    res.status(200).send(tasks);
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch pending tasks", error: error.message });
  }
};

exports.getMyMessages = async (req, res) => {
  try {
    const { userId } = req.query; // รับ userId มา
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const messages = await submissionService.getMyMessages(userId);
    res.status(200).send(messages);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch messages", error: error.message });
  }
};
