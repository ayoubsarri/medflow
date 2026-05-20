/**
 * =============================================================================
 * ADMIN ROUTES — routes/adminRoutes.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This file is the "traffic directory" of our backend. It defines WHICH function
 * runs when a specific URL is requested. The actual logic lives in controllers.
 *
 * MVC FLOW:
 *   Browser Request → server.js → adminRoutes.js (routing) → Controller (logic) → Model (data)
 *
 * SECURITY MODEL:
 *   Every route here is protected by two middleware functions applied in order:
 *     1. verifyToken  — confirms the request carries a valid, unexpired JWT
 *     2. requireAdmin — confirms the token belongs to a user with role 'Admin'
 *   A request that fails either check is rejected before reaching the controller.
 * =============================================================================
 */

const express = require('express');
const router  = express.Router();

const { verifyToken, requireAdmin, requireRole } = require('../middleware/auth');
const adminCtrl    = require('../controllers/adminController');
const statsCtrl    = require('../controllers/statsController');
const auditCtrl    = require('../controllers/auditController');
const reportCtrl   = require('../controllers/reportController');
const settingsCtrl = require('../controllers/settingsController');

// ─── STAFF MANAGEMENT ROUTES ──────────────────────────────────────────────────

// [GET] /staff — Fetches all staff members sorted newest first | Access: Admin
router.get('/staff', verifyToken, requireAdmin, adminCtrl.getAllStaff);

// [GET] /staff/search — Performs a case-insensitive search across staff | Access: Admin
router.get('/staff/search', verifyToken, requireAdmin, adminCtrl.searchStaff);

// [POST] /add-staff — Creates a new staff member account | Access: Admin
router.post('/add-staff', verifyToken, requireAdmin, adminCtrl.addStaff);

// [DELETE] /delete-staff/:id — Deletes a specific staff member by ID | Access: Admin
router.delete('/delete-staff/:id', verifyToken, requireAdmin, adminCtrl.deleteStaff);

// [PATCH] /toggle-status/:id — Toggles a staff member's active/suspended status | Access: Admin
router.patch('/toggle-status/:id', verifyToken, requireAdmin, adminCtrl.toggleStatus);

// [GET] /staff/:id/schedule — Retrieves the saved schedule for a specific doctor | Access: Admin
router.get('/staff/:id/schedule', verifyToken, requireAdmin, adminCtrl.getStaffSchedule);

// [PUT] /staff/:id/schedule — Saves the admin-configured time-slot schedule | Access: Admin
router.put('/staff/:id/schedule', verifyToken, requireAdmin, adminCtrl.updateStaffSchedule);

// ─── DASHBOARD ANALYTICS ROUTES ───────────────────────────────────────────────

// [GET] /stats — Retrieves all dashboard statistics and aggregation data | Access: Admin
router.get('/stats', verifyToken, requireAdmin, statsCtrl.getDashboardStats);

// ─── AUDIT LOG ROUTES ─────────────────────────────────────────────────────────

// [GET] /audit-logs — Fetches paginated audit logs with search and role filters | Access: Admin
router.get('/audit-logs', verifyToken, requireAdmin, auditCtrl.getAuditLogs);

// [GET] /audit-logs/recent — Fetches the 20 most recent audit log entries | Access: Admin
router.get('/audit-logs/recent', verifyToken, requireAdmin, auditCtrl.getRecentLogs);

// ─── SYSTEM REPORTS ROUTES ────────────────────────────────────────────────────

// [POST] /reports/generate — Calculates stats for a period and creates a report | Access: Admin
router.post('/reports/generate', verifyToken, requireAdmin, reportCtrl.generateReport);

// [GET] /reports — Retrieves a list of all previously generated reports | Access: Admin
router.get('/reports', verifyToken, requireAdmin, reportCtrl.getAllReports);

// [GET] /reports/export/:id — Converts a report to CSV and initiates file download | Access: Admin
router.get('/reports/export/:id', verifyToken, requireAdmin, reportCtrl.exportReport);

// [GET] /reports/:id — Fetches the full detailed data of a single report | Access: Admin
router.get('/reports/:id', verifyToken, requireAdmin, reportCtrl.getReportById);

// ─── SYSTEM SETTINGS ROUTES ───────────────────────────────────────────────────

// [GET] /settings — Fetches clinic settings and real-time database health | Access: Admin
router.get('/settings', verifyToken, requireAdmin, settingsCtrl.getSettings);

// [PUT] /settings — Updates the global working hours configuration | Access: Admin
router.put('/settings', verifyToken, requireAdmin, settingsCtrl.updateSettings);

// [POST] /settings/backup — Simulates a system backup and records the timestamp | Access: Admin
router.post('/settings/backup', verifyToken, requireAdmin, settingsCtrl.triggerBackup);

module.exports = router;
