const express = require("express");
const router = express.Router();
const weightController = require("../controllers/weight.controller");

// GET /api/weights/raw-material?lot=...&line=...&batch=...
router.get("/raw-material", weightController.getRawMaterialWeights);

module.exports = router;
