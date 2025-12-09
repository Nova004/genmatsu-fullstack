// controllers/submission.controller.js
const submissionService = require("../services/submission.service");
const pdfService = require("../services/pdf.service");

exports.createSubmission = async (req, res) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = req.body;

  if (!formType || !templateIds || templateIds.length === 0 || !formData) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    const submissionId = await submissionService.createSubmission(req.body);
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

exports.getAllSubmissions = async (req, res) => {
  try {
    const { category } = req.query;
    const submissions = await submissionService.getAllSubmissions(category);
    res.status(200).send(submissions);
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
  try {
    const isDeleted = await submissionService.deleteSubmission(id);
    if (!isDeleted) {
      return res
        .status(404)
        .send({ message: `Submission with ID ${id} not found.` });
    }
    res
      .status(200)
      .send({ message: `Submission ID ${id} has been deleted successfully.` });
  } catch (err) {
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
    await submissionService.updateSubmission(id, lot_no, form_data);
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
    await submissionService.resubmitSubmission(id, formDataJson);
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
    // รับค่า level มาจาก Query String (เช่น ?level=1)
    const { level } = req.query;

    if (!level) {
      return res.status(400).json({ message: "User Level is required" });
    }

    // เรียก Service ที่เราทำไว้ก่อนหน้านี้
    const tasks = await submissionService.getMyPendingTasks(parseInt(level));

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
