/**
 * =============================================================================
 * REPORT MODEL — models/Report.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * When the admin clicks "Generate Report" on the System Reports page, our backend
 * calculates a snapshot of clinic statistics for the chosen period and saves it
 * as a Report document in this collection.
 *
 * WHY SAVE THE REPORT TO THE DATABASE?
 * If we only calculated and returned the data without saving it, the admin would
 * lose the report the moment they refreshed the page. By persisting reports, we
 * power the "Previous Reports" table which shows historical snapshots.
 *
 * Also: reports represent a point-in-time snapshot. If a patient is deleted after
 * a report was generated, the report still correctly shows the old data — which
 * is what accountants and auditors need.
 * =============================================================================
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({

    // The display name, e.g., "April 2026 Monthly Summary"
    name: {
        type: String,
        required: true,
        trim: true
    },

    // The report category. Matches the dropdown options in the frontend.
    type: {
        type: String,
        enum: ['Monthly Summary', 'Quarterly Overview', 'Annual Report'],
        required: true
    },

    // The period this report covers. Stored as separate fields for easy querying.
    month: { type: String },   // e.g., "April"
    year:  { type: String },   // e.g., "2026"

    // ─── The Actual Report Data ──────────────────────────────────────────────────
    // STUDENT DEFENSE NOTE:
    // We store the snapshot data as a nested object (sub-document). `Mixed` type
    // in Mongoose means we can store any JSON structure here — it's flexible.
    // This holds the calculated numbers at the time the report was generated.
    data: {
        totalPatients:      { type: Number, default: 0 },
        totalAppointments:  { type: Number, default: 0 },
        completedAppointments: { type: Number, default: 0 },
        cancelledAppointments: { type: Number, default: 0 },
        noShowCount:        { type: Number, default: 0 },
        noShowRate:         { type: String, default: '0%' },
        activeStaff:        { type: Number, default: 0 },
        newPatients:        { type: Number, default: 0 },  // New patients registered during period
        revenueEstimate:    { type: String, default: 'N/A' } // Placeholder for future billing integration
    },

    // Who generated this report (for accountability)
    generatedBy: { type: String, default: 'Admin' },

}, {
    // `timestamps: true` gives us `createdAt` which we display as "Generated: April 1, 2026"
    // on the Previous Reports list in the frontend.
    timestamps: true
});

// Export the model. Mongoose will create a 'reports' collection.
module.exports = mongoose.model('Report', reportSchema);
