const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLog.controller");
// const authJwt = require("../middlewares/authJwt"); // Uncomment if you want to protect this route

// router.get("/", [authJwt.verifyToken, authJwt.isAdmin], activityLogController.getAllLogs);
router.get("/", activityLogController.getAllLogs); // Open for now, or add middleware as needed

module.exports = router;
