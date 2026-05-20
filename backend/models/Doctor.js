/**
 * =============================================================================
 * DOCTOR MODEL — models/Doctor.js
 * =============================================================================
 *
 * This model represents a Doctor user. It extends UserBase and adds:
 * name, password, specialization, specialty, dob, emergencyContact,
 * workingHours, workingDays, isAdmin, joined, workload tracking fields
 * (consultations, appointmentsManaged, tasksCompleted, hoursWorked),
 * and the Smart Booking schedule configuration.
 *
 * When you call Doctor.find(), Mongoose automatically filters by { role: 'Doctor' },
 * so you will never accidentally get Admin or Patient documents back.
 * =============================================================================
 */

const mongoose = require('mongoose');
const User = require('./UserBase');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    specialization: { type: String, trim: true },
    specialty: { type: String, trim: true },
    dob: { type: String },
    emergencyContact: { type: String },
    workingHours: { type: String, default: '08:00 - 18:00' },
    workingDays: { type: String, default: 'Mon, Tue, Wed, Thu, Fri' },
    isAdmin: { type: Boolean, default: false },
    joined: { type: Date, default: Date.now },

    // Workload tracking fields for dashboard statistics
    consultations: { type: Number, default: 0 },
    appointmentsManaged: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    hoursWorked: { type: Number, default: 0 },

    // For the Smart Booking feature
    schedule: {
        slotDuration: { type: Number, default: 30 },
        availableSlots: [{
            startTime: String,
            endTime: String,
            status: { type: String, default: 'available' }
        }]
    }
});

// Create 'Doctor' as a discriminator of User with role = 'Doctor'
const Doctor = User.discriminator('Doctor', doctorSchema);

module.exports = Doctor;