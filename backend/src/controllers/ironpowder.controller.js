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
    const ironpowderId = await ironpowderService.createIronpowder({
      lotNo,
      formData,
      submittedBy,
    });

    res.status(201).send({
      message: "Ironpowder form submitted successfully!",
      ironpowderId: ironpowderId,
    });
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
    const data = await ironpowderService.getAllIronpowder();
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
  } catch (error) {
    console.error("Error resubmitting ironpowder:", error.message);
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};
