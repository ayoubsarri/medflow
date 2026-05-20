/**
 * =============================================================================
 * RECEPTIONIST MODEL — models/Receptionist.js
 * =============================================================================
 *
 * This model represents a Receptionist user. It extends UserBase and adds:
 * name, password, dob, emergencyContact, workingHours, workingDays, isAdmin,
 * joined, and workload tracking fields (consultations, appointmentsManaged,
 * tasksCompleted, hoursWorked).
 *
 * When you call Receptionist.find(), Mongoose automatically filters by
 * { role: 'Receptionist' }, so you will never accidentally get Admin or
 * Doctor documents back.
 * =============================================================================
 */

const mongoose = require('mongoose');
const User = require('./UserBase');

const receptionistSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Staff name is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], select: false },
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
    hoursWorked: { type: Number, default: 0 }
});

// Create 'Receptionist' as a discriminator of User with role = 'Receptionist'
const Receptionist = User.discriminator('Receptionist', receptionistSchema);

module.exports = Receptionist;
