/**
 * =============================================================================
 * SYSTEM SETTINGS MODEL — models/SystemSettings.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * Unlike other models (Staff, Patient, Appointment) where a new document is
 * created for every new record, the SystemSettings model uses a "Singleton
 * Pattern" — there is always exactly ONE settings document in the collection.
 *
 * SINGLETON PATTERN:
 * Our `settingsController.js` always looks for this one document using a fixed
 * identifier. If it doesn't exist yet (first run), the controller creates it
 * with sensible defaults. This is called "upsert" (update or insert).
 *
 * The Settings page uses:
 *   GET /api/admin/settings → fetches the single document to populate the form
 *   PUT /api/admin/settings → updates `workingHours` (the only editable field)
 *   POST /api/admin/settings/backup → updates `lastBackup` timestamp
 * =============================================================================
 */

const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({

    // ─── Read-Only Clinic Information (displayed but not editable in the UI) ─────

    clinicName: {
        type: String,
        default: 'MedFlow Clinic'
    },
    address: {
        type: String,
        default: '123 Medical Center Blvd, Algiers'
    },
    phone: {
        type: String,
        default: '+213 21 123 456'
    },

    // ─── Editable Settings ───────────────────────────────────────────────────────

    // The ONLY field the admin can change via the Settings UI.
    // Default matches what is shown in the frontend's initial state.
    workingHours: {
        type: String,
        default: '8:00 AM - 6:00 PM'
    },

    // ─── Backup Management ───────────────────────────────────────────────────────

    // STUDENT DEFENSE NOTE:
    // `lastBackup` is updated every time the admin clicks "Run Backup Now".
    // The Settings page displays this date under "Backup Settings".
    lastBackup: {
        type: Date,
        default: null
    },

    autoBackupSchedule: {
        type: String,
        default: 'Daily at 2:00 AM'
    },

    // ─── System Health (read-only, computed at runtime by the controller) ────────
    // STUDENT DEFENSE NOTE:
    // These are NOT stored in the database — they are dynamic values.
    // The controller adds them to the response when fetching settings.
    // We include them as notes here for documentation purposes only.
    //
    //   databaseStatus: calculated by checking mongoose.connection.readyState
    //   apiStatus: always "Operational" if the server responds
    //   systemUptime: calculated using process.uptime()
    //   emailService: always "Connected" for simulation purposes

}, {
    timestamps: true  // Tracks when settings were last changed
});

// Export the model. Mongoose creates a 'systemsettings' collection.
module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
