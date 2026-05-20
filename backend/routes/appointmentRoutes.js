const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// [GET] /queue — Fetches the live queue of current and upcoming patients | Access: Public
router.get('/queue', appointmentController.getQueue);

module.exports = router;
