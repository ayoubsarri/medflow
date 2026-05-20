/**
 * =============================================================================
 * PATIENT MODEL — models/Patient.js
 * =============================================================================
 * Patients are stored in the dedicated 'patients' collection, separate from
 * the staff 'users' collection. They have no password — portal access is via
 * fileCode only.
 * =============================================================================
 */

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // --- Identity ---
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // --- Portal Security & Logic ---
    fileCode: { type: String, unique: true, sparse: true, trim: true },
    isExisting: { type: Boolean, default: false },

    // --- Medical conditions ---
    chronicConditions: { type: String, default: 'None' },
    allergies: { type: String, default: 'None' },
    hereditaryConditions: { type: String, default: 'None' },

    // --- Emergency & Settings ---
    emergencyNumber: { type: String },
    reminders: {
        email: { type: Boolean, default: true },
    },

    // --- Old Records (File Storage) ---
    oldRecords: [{
        fileName: { type: String },
        fileType: { type: String },
        uploadDate: { type: Date, default: Date.now },
        fileUrl: { type: String }
    }]
}, {
    collection: 'patients',
    timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
