// backend/src/controllers/ironpowder.controller.js

const ironpowderService = require("../services/ironpowder.service");

exports.createIronpowder = async (req, res) => {
  const { lotNo, formData, submittedBy } = req.body;

  if (!lotNo || !formData || !submittedBy) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    // ตรวจสอบ Lot No ซ้ำ
    const isDuplicate = await ironpowderService.checkLotNoExists(lotNo);
    if (isDuplicate) {
      return res.status(409).send({
        message: `Lot No: ${lotNo} มีอยู่ในระบบแล้ว`,
        errorCode: "DUPLICATE_LOT",
      });
    }

    // บันทึกข้อมูล
    const submissionId = await ironpowderService.createIronpowder({
      lotNo,
      formData,
      submittedBy,
    });

    res.status(201).send({
      message: "Ironpowder form submitted successfully!",
      submissionId: submissionId,
    });

    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", lotNo: lotNo });
    }
  } catch (error) {
    console.error("Error creating ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};

exports.getAllIronpowder = async (req, res) => {
  try {
    const { page, pageSize, search, startDate, endDate, status } = req.query;

    const params = {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      search: search || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || '',
      category: req.query.category || 'Recycle',
      user: req.query.user || '', // ✅ Pass User filter
      formType: req.query.formType || '' // ✅ Pass Form Type filter
    };

    const data = await ironpowderService.getAllIronpowder(params);
    res.status(200).send(data);
  } catch (error) {
    console.error("Error fetching ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};

exports.getIronpowderById = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await ironpowderService.getIronpowderById(id);
    if (!data) {
      return res.status(404).send({ message: "Ironpowder not found" });
    }
    res.status(200).send(data);
  } catch (error) {
    console.error("Error fetching ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};

exports.updateIronpowder = async (req, res) => {
  const { id } = req.params;
  const { formData } = req.body;

  try {
    await ironpowderService.updateIronpowder(id, formData);
    res.status(200).send({
      message: "Ironpowder updated successfully!",
    });

    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", lotNo: formData.basicData?.lotNo });
    }
  } catch (error) {
    console.error("Error updating ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};

exports.deleteIronpowder = async (req, res) => {
  const { id } = req.params;

  try {
    await ironpowderService.deleteIronpowder(id);
    res.status(200).send({ message: "Ironpowder deleted successfully!" });

    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", deletedId: id });
    }
  } catch (error) {
    console.error("Error deleting ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};

exports.resubmitIronpowder = async (req, res) => {
  const { id } = req.params;
  const { formData, submittedBy } = req.body;

  try {
    await ironpowderService.resubmitIronpowder(id, formData, submittedBy);
    res.status(200).send({
      message: "Ironpowder resubmitted successfully!",
    });

    if (req.io) {
      req.io.emit("server-action", { action: "refresh_data", resubmittedId: id });
    }
  } catch (error) {
    console.error("Error resubmitting ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};
