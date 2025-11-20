const express = require('express');
const router = express.Router();
const naclController = require('../controllers/nacl.controller');

// Middleware (ถ้ามี, เช่น verifyToken)
// const { verifyToken } = require("../middleware");
// router.use(verifyToken);

router.get('/', naclController.getAllNaCl);
router.post('/', naclController.createNaCl);
router.put('/:id', naclController.updateNaCl);
router.delete('/:id', naclController.deleteNaCl);
router.get('/lookup/:cgWater/:naclType/:chemicalsType', naclController.lookupNaClValue);

module.exports = router;