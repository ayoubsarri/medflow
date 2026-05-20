/**
 * =============================================================================
 * RECEPTIONIST ROUTES — routes/receptionistRoutes.js
 * =============================================================================
 */

const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');
const appointmentCtrl = require('../controllers/appointmentController');
const patientCtrl = require('../controllers/patientController');
const Doctor = require('../models/Doctor');

const staffOnly = [verifyToken, requireRole('Receptionist', 'Admin')];

// [GET] / — Provides a quick health-check for the API | Access: Public
router.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Receptionist API is active' });
});

// ─── APPOINTMENT ROUTES ───────────────────────────────────────────────────────

// [GET] /appointments — Fetches appointments filtered by date, doctor, or status | Access: Receptionist, Admin
router.get('/appointments', ...staffOnly, appointmentCtrl.getAllAppointments);

// [GET] /appointments/:id — Fetches full details for a single appointment | Access: Receptionist, Admin
router.get('/appointments/:id', ...staffOnly, appointmentCtrl.getAppointmentById);

// [POST] /appointments — Creates a new appointment with smart booking validation | Access: Receptionist, Admin
router.post('/appointments', ...staffOnly, appointmentCtrl.createAppointment);

// [PATCH] /appointments/:id/status — Updates an appointment's status (e.g., Confirmed) | Access: Receptionist, Admin
router.patch('/appointments/:id/status', ...staffOnly, appointmentCtrl.updateAppointmentStatus);

// [DELETE] /appointments/:id — Soft-cancels an appointment to maintain audit trail | Access: Receptionist, Admin
router.delete('/appointments/:id', ...staffOnly, appointmentCtrl.deleteAppointment);

// ─── DOCTORS & SMART BOOKING ──────────────────────────────────────────────────

// [GET] /doctors — Retrieves a list of all active doctors for dropdown menus | Access: Receptionist, Admin
router.get('/doctors', ...staffOnly, async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'Active' });
    res.status(200).json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// [GET] /doctors/:doctorId/available-slots — Checks time slot availability for a date | Access: Receptionist, Admin
router.get('/doctors/:doctorId/available-slots', ...staffOnly, appointmentCtrl.getDoctorAvailableSlots);

// ─── PATIENT ROUTES ───────────────────────────────────────────────────────────

// [GET] /patients — Fetches patients with optional name/email search and status filters | Access: Receptionist, Admin
router.get('/patients', ...staffOnly, patientCtrl.getAllPatients);

// [GET] /patients/:id — Fetches the complete medical profile of a specific patient | Access: Receptionist, Admin
router.get('/patients/:id', ...staffOnly, patientCtrl.getPatientById);

// [POST] /patients — Registers a brand-new active patient from the front desk | Access: Receptionist, Admin
router.post('/patients', ...staffOnly, patientCtrl.addPatient);

// [PUT] /patients/:id — Updates personal or medical details of an existing patient | Access: Receptionist, Admin
router.put('/patients/:id', ...staffOnly, patientCtrl.updatePatient);

module.exports = router;
