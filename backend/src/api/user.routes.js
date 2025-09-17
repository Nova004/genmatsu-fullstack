// backend/src/api/user.routes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// GET /api/users/
router.get('/', userController.getAllUsers);

// GET /api/users/search
router.get('/search', userController.searchUsers);

// PUT /api/users/:id -> สำหรับอัปเดต Employee No.
router.put('/:id', userController.updateUserEmployeeNo);

router.get('/users/:id', userController.findUserById);

module.exports = router;