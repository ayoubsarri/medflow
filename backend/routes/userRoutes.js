const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// [GET] /profile — Retrieves the authenticated user's profile | Access: Logged-in Users
router.get('/profile', protect, userController.getProfile);

module.exports = router;
