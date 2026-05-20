const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

// [GET] /public — Fetches a simple list of all active doctors for the public form | Access: Public
router.get('/public', doctorController.getPublicDoctors);

// [GET] /dashboard — Fetches today's checked-in and completed patients | Access: Doctor
router.get('/dashboard', protect, doctorController.getDoctorDashboard);

// [POST] /consultation/save — Saves a consultation record and completes the appointment | Access: Doctor
router.post('/consultation/save', protect, doctorController.saveConsultation);

// [PATCH] /appointment/:appointmentId/reschedule — Updates the date and time of an existing appointment | Access: Doctor
router.patch('/appointment/:appointmentId/reschedule', protect, doctorController.rescheduleAppointment);

// [DELETE] /appointment/:appointmentId/cancel — Cancels an appointment and removes it from schedule | Access: Doctor
router.delete('/appointment/:appointmentId/cancel', protect, doctorController.deleteAppointment);

// [GET] /patient/:patientId/history — Loads past medical visits for the dashboard modal | Access: Doctor
router.get('/patient/:patientId/history', protect, doctorController.getPatientMedicalHistory);

// [GET] /patient/:patientId/profile — Loads the full detailed medical profile | Access: Doctor
router.get('/patient/:patientId/profile', protect, doctorController.getDetailedPatientProfile);

// [GET] /patients/dropdown — Fetches a simple list of all patients for dropdowns | Access: Doctor
router.get('/patients/dropdown', protect, doctorController.getPatientDropdown);

// [GET] /my-patients — Retrieves all unique patients who have visited this doctor | Access: Doctor
router.get('/my-patients', protect, doctorController.getMyPatients);

// [GET] /schedule/range — Fetches confirmed appointments within a specific date range | Access: Doctor
router.get('/schedule/range', protect, doctorController.getScheduleByRange);

// [POST] /print/prescription — Generates a PDF prescription for a patient | Access: Doctor
router.post('/print/prescription', protect, doctorController.printPrescription);

// [POST] /print/justification — Generates a PDF medical justification | Access: Doctor
router.post('/print/justification', protect, doctorController.printJustification);

// [GET] /justifications — Fetches all past consultations that include a medical justification | Access: Doctor
router.get('/justifications', protect, doctorController.getAllJustifications);

// [POST] /justifications/new — Creates a new medical justification independent of an appointment | Access: Doctor
router.post('/justifications/new', protect, doctorController.addNewJustification);

// [PATCH] /profile/:doctorId — Updates the doctor's personal profile information | Access: Doctor
router.patch('/profile/:doctorId', protect, doctorController.updateDoctorProfile);

module.exports = router;
