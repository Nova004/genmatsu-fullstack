// backend/src/api/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// GET /api/users/
router.get("/all-with-gen-manu", userController.getAllUsersWithGenManu);

// GET /api/users/search
router.get('/search', userController.searchUsers);

// PUT /api/users/:id -> สำหรับอัปเดต Employee No.
router.put("/gen-manu-data", userController.updateUserGenManuData);

// GET /api/users/:id -> สำหรับค้นหา User จาก ID
router.get('/:id', userController.findUserById); // <-- แก้ไขตรงนี้

module.exports = router;