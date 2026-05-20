/**
 * =============================================================================
 * SETTINGS CONTROLLER — controllers/settingsController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller manages the single SystemSettings document in the database.
 * It implements the "Singleton Pattern" — only ONE settings record ever exists.
 *
 * SINGLETON PATTERN IMPLEMENTATION:
 * Instead of creating a new document for each request, we always find-or-create
 * the one settings document. We use Mongoose's `findOneAndUpdate` with the
 * `{ upsert: true }` option. "Upsert" = "Update if found, Insert if not found."
 *
 * DYNAMIC HEALTH DATA:
 * Some values on the Settings page are NOT stored in the database — they are
 * calculated in real-time from the server's state:
 *   - Database status: checked via `mongoose.connection.readyState`
 *   - System uptime: via `process.uptime()`
 * These are added to the response object in the controller, not stored in MongoDB.
 * =============================================================================
 */

const SystemSettings = require('../models/SystemSettings');
const logAction      = require('../utils/auditLogger');
const mongoose       = require('mongoose');

// ─── 1. GET SETTINGS ────────────────────────────────────────────────────────
/**
 * GET /api/admin/settings
 *
 * STUDENT DEFENSE NOTE:
 * `findOneAndUpdate` with `{ upsert: true, new: true }` is a compound
 * operation. In one atomic database call, it:
 *   - Finds the single settings document (filter: `{}` = find any)
 *   - If found: returns it as-is (we're not updating anything here, just reading)
 *   - If NOT found (first run): creates it with the default values from the Schema
 *
 * `new: true` means "return the document AFTER the operation" (vs. before).
 * `setDefaultsOnInsert: true` applies the Schema's default values when creating.
 */
exports.getSettings = async (req, res) => {
    try {
        // Find or create the singleton settings document.
        let settings = await SystemSettings.findOneAndUpdate(
            {},                             // Filter: match any document (the one and only)
            {},                             // Update: nothing (we're just reading)
            {
                upsert: true,              // Create if it doesn't exist
                new: true,                 // Return the resulting document
                setDefaultsOnInsert: true  // Use Schema defaults when inserting
            }
        );

        // ─── Add Dynamic (Real-Time) Health Data ─────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // `mongoose.connection.readyState` is a number:
        //   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        // We check for `=== 1` to confirm the database is truly connected.
        const dbConnected = mongoose.connection.readyState === 1;

        // `process.uptime()` returns seconds since Node.js process started.
        const uptimeSeconds = process.uptime();
        const uptimeHours   = Math.floor(uptimeSeconds / 3600);
        const uptimeMins    = Math.floor((uptimeSeconds % 3600) / 60);

        // Convert the Mongoose document to a plain JavaScript object so we
        // can add extra dynamic properties to it before sending.
        const responseData = settings.toObject();

        // Attach dynamic health properties to the response.
        responseData.health = {
            databaseStatus: dbConnected ? 'Connected' : 'Disconnected',
            apiStatus:      'Operational',     // If we get here, the API is obviously running
            emailService:   'Connected',       // Simulated for demonstration
            systemUptime:   `${uptimeHours}h ${uptimeMins}m`
        };

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// ─── 2. UPDATE SETTINGS ─────────────────────────────────────────────────────
/**
 * PUT /api/admin/settings
 * Body: { workingHours: "9:00 AM - 5:00 PM" }
 *
 * STUDENT DEFENSE NOTE:
 * Per the frontend UI, ONLY `workingHours` is editable. The other fields
 * (clinicName, address, phone) are displayed as read-only text. This controller
 * enforces that constraint by only extracting `workingHours` from `req.body`
 * and ignoring any other fields the user might try to send.
 *
 * This is "whitelist-based updating" — a security best practice.
 * Instead of blindly updating `{ ...req.body }`, we pick ONLY what we allow.
 * This prevents "mass assignment" attacks where a malicious user might try to
 * update restricted fields by injecting extra JSON properties.
 */
exports.updateSettings = async (req, res) => {
    try {
        // WHITELIST: Only allow `workingHours` to be updated.
        const { workingHours } = req.body;

        if (!workingHours || workingHours.trim() === '') {
            return res.status(400).json({ message: 'Working hours value is required' });
        }

        // Update the singleton settings document.
        // `{ new: true }` returns the document AFTER the update.
        const updated = await SystemSettings.findOneAndUpdate(
            {},                          // Match the one settings document
            { $set: { workingHours } },  // Only update the `workingHours` field
            { new: true, upsert: true }  // Return updated doc; create if missing
        );

        // Write to audit log.
        await logAction(req, 'Admin', 'Admin', `Updated working hours to: ${workingHours}`);

        res.status(200).json({
            message: 'Working hours updated successfully',
            workingHours: updated.workingHours
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};

// ─── 3. TRIGGER BACKUP ──────────────────────────────────────────────────────
/**
 * POST /api/admin/settings/backup
 *
 * STUDENT DEFENSE NOTE:
 * In a production system, this would trigger a real backup mechanism (e.g.,
 * mongodump, AWS S3 snapshot, etc.). For our academic project, we:
 *   1. Update the `lastBackup` timestamp in the settings document.
 *   2. Write an audit log entry.
 *   3. Return a success response.
 *
 * This simulates the backup operation while providing a fully functional
 * backend endpoint that the frontend Settings page can connect to.
 *
 * `Date.now` vs `new Date()`: Both work. `Date.now` returns a Unix timestamp
 * (number of milliseconds since Jan 1, 1970). Mongoose automatically converts
 * it to a proper Date object because the field type is `Date`.
 */
exports.triggerBackup = async (req, res) => {
    try {
        const backupTime = new Date();

        // Update the lastBackup field to record when the backup was triggered.
        await SystemSettings.findOneAndUpdate(
            {},
            { $set: { lastBackup: backupTime } },
            { upsert: true }
        );

        // Log the backup action as a "System" role action.
        await logAction(req, 'Admin', 'Admin', 'Manual system backup initiated');

        res.status(200).json({
            message: 'Backup initiated successfully',
            lastBackup: backupTime.toLocaleDateString('en-GB', {
                year: 'numeric', month: 'long', day: 'numeric'
            })
        });
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
};
