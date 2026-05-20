/**
 * =============================================================================
 * AUDIT LOG MODEL — models/AuditLog.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * An Audit Log is a permanent, tamper-evident record of every important action
 * taken in a system. Think of it like a "flight recorder" — it writes down
 * who did what, when, and from where.
 *
 * WHY IS THIS IMPORTANT?
 * In medical systems, audit logging is not optional — it is a legal and ethical
 * requirement. If a patient record is accidentally deleted, an audit log tells
 * you exactly who deleted it and when.
 *
 * The Admin Audit Logs page fetches from this collection to display a real-time
 * feed of system events. Each time an admin adds/deletes/toggles a staff member,
 * or generates a report, our `auditLogger.js` utility writes a new document here.
 *
 * KEY DESIGN DECISION:
 * Audit logs are APPEND-ONLY. We never update or delete audit records. This
 * maintains a trustworthy historical trail.
 * =============================================================================
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({

    // The name of the user who performed the action (e.g., "Lyne", "Sarah")
    name: {
        type: String,
        required: true,
        default: 'System'
    },

    // The role of the user (Admin, Doctor, Receptionist, System)
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Doctor', 'Receptionist', 'System'],
        default: 'Admin'
    },

    // A human-readable description of what happened.
    // Examples: "Created Staff Account", "Generated Monthly Report", "Deleted Patient Record"
    action: {
        type: String,
        required: [true, 'Action description is required'],
        trim: true
    },

    // The IP address of the user at the time of the action.
    // "System" is used for automated actions like backups.
    // `req.ip` in Express gives us the IP address automatically.
    ipAddress: {
        type: String,
        default: 'Unknown'
    },

    // STUDENT DEFENSE NOTE:
    // We do NOT use `timestamps: true` here because we want the `createdAt` to be
    // the definitive, unmodifiable timestamp of the event. We add it manually below
    // with `default: Date.now` and `immutable: true` to prevent any modification.
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true  // Once set, this value CANNOT be changed. Makes the log tamper-resistant.
    }

}, {
    // We set timestamps to false because we manage `createdAt` manually above.
    timestamps: false
});

// Index by createdAt descending so the most recent logs load fastest.
auditLogSchema.index({ createdAt: -1 });

// Export the model. Mongoose will create an 'auditlogs' collection in MongoDB.
module.exports = mongoose.model('AuditLog', auditLogSchema);
