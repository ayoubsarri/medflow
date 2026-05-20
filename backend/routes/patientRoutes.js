/**
 * PATIENT ROUTES
 * Maps the Patient Portal URLs to the logic in patientController.js.
 */
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

// [POST] /request — Registers a new patient and creates an initial appointment request | Access: Public
router.post('/request', patientController.registerPatient);

// [POST] /login — Authenticates an existing patient using their file code | Access: Public
router.post('/login', patientController.loginByFileCode);

// [POST] /book — Confirms an appointment for an existing logged-in patient | Access: Patient
router.post('/book', patientController.bookAppointmentInternal);

// [GET] /dashboard/:patientId — Retrieves upcoming active appointments for the patient | Access: Patient
router.get('/dashboard/:patientId', patientController.getDashboard);

// [PATCH] /cancel/:appointmentId — Soft-cancels an existing appointment | Access: Patient
router.patch('/cancel/:appointmentId', patientController.cancelAppointment);

// [PATCH] /profile/:id — Updates a patient's personal profile information | Access: Patient
router.patch('/profile/:id', patientController.updateProfile);

// [GET] /history/:patientId — Retrieves past consultation history for a patient | Access: Patient
router.get('/history/:patientId', patientController.getConsultationHistory);

// [POST] /records/:patientId — Uploads and attaches an external medical record | Access: Patient
router.post('/records/:patientId', patientController.uploadOldRecord);

// [GET] /records/:patientId — Retrieves a specific patient's old records | Access: Patient/Admin
router.get('/records/:patientId', protect, patientController.getOldRecords);

// [GET] /records — Retrieves the logged-in patient's old records (used by Patient Dashboard) | Access: Patient
router.get('/records', protect, patientController.getOldRecords);

// [GET] /profile — Fetches the secure profile using the JWT token | Access: Patient
router.get('/profile', protect, patientController.getProfileByToken);

module.exports = router;
