// backend/src/api/ironpowder.routes.js

const express = require("express");
const router = express.Router();
const ironpowderController = require("../controllers/ironpowder.controller");
const validate = require("../middlewares/validation.middleware");
const ironpowderSchemas = require("../validators/ironpowder.validator");

// POST /api/ironpowder - สร้าง/บันทึก Ironpowder form
router.post(
  "/",
  validate(ironpowderSchemas.createIronpowder),
  ironpowderController.createIronpowder
);

// GET /api/ironpowder - ดึงรายการทั้งหมด
router.get("/", ironpowderController.getAllIronpowder);

// GET /api/ironpowder/:id - ดึงรายการเดียว
router.get("/:id", ironpowderController.getIronpowderById);

// PUT /api/ironpowder/:id - แก้ไขข้อมูล
router.put(
  "/:id",
  validate(ironpowderSchemas.updateIronpowder),
  ironpowderController.updateIronpowder
);

// DELETE /api/ironpowder/:id - ลบข้อมูล
router.delete("/:id", ironpowderController.deleteIronpowder);

// PUT /api/ironpowder/:id/resubmit - ส่งใหม่หลังจาก Rejected
router.put("/resubmit/:id", ironpowderController.resubmitIronpowder);

module.exports = router;
