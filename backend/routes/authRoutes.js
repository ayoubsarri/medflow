const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// [POST] /login — Authenticates staff members and returns a JWT | Access: Public
router.post('/login', authController.login);

module.exports = router;
