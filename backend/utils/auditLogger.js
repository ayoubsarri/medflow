/**
 * =============================================================================
 * AUDIT LOGGER UTILITY — utils/auditLogger.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This is a "helper function" — a small utility that many different controllers
 * can share. Instead of writing the same audit log code inside every controller,
 * we write it once here and import it wherever needed.
 *
 * This follows the "DRY" principle: Don't Repeat Yourself.
 *
 * HOW IT WORKS:
 * Any controller can call:
 *   await logAction(req, 'Admin', 'Lyne', 'Created Staff Account');
 *
 * And this function quietly writes a new AuditLog document to MongoDB in the
 * background. The Audit Logs page then fetches these documents from the database.
 *
 * WHY async/await with try/catch?
 * If audit logging fails (e.g., a brief DB timeout), we do NOT want it to crash
 * the main operation. Logging should be "best effort" — the main action (like
 * adding a staff member) must still succeed even if logging briefly fails.
 * =============================================================================
 */

const AuditLog = require('../models/AuditLog');

/**
 * logAction — writes a single audit event to the AuditLog collection.
 *
 * @param {object} req    - The Express request object (we extract the IP from here)
 * @param {string} role   - The role performing the action  (e.g., 'Admin', 'Doctor')
 * @param {string} name   - The name of the person performing the action (e.g., 'Lyne')
 * @param {string} action - Human-readable description of the event (e.g., 'Created Staff Account')
 *
 * @returns {Promise<void>} - Does not return meaningful data; we only care if it throws.
 */
const logAction = async (req, role, name, action) => {
    try {
        // STUDENT DEFENSE NOTE:
        // `req.ip` is automatically provided by Express. It reads the IP address
        // from the incoming HTTP request headers. This is how we know which
        // computer/location the action came from.
        //
        // `req.headers['x-forwarded-for']` handles cases where our Express server
        // is behind a reverse proxy (like Nginx), which is common in production.
        // The proxy adds the real client IP into this header.
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'Unknown';

        // Create and save the audit log document.
        await AuditLog.create({
            name:      name   || 'System',
            role:      role   || 'Admin',
            action:    action || 'Unknown Action',
            ipAddress: ipAddress
            // `createdAt` is handled automatically by the schema's `default: Date.now`
        });

    } catch (err) {
        // STUDENT DEFENSE NOTE:
        // We use console.error here instead of throwing the error because:
        // - Audit logging is secondary to the main operation.
        // - If logging fails, we don't want the entire "Add Staff" request to fail.
        // - The error is printed to the server console so developers can investigate.
        console.error('[AuditLogger] Failed to write audit log:', err.message);
        // Note: We intentionally do NOT re-throw the error.
    }
};

module.exports = logAction;
