/**
 * =============================================================================
 * ADMIN MODEL — models/Admin.js
 * =============================================================================
 *
 * This model represents an Admin user. It extends UserBase and adds:
 * name, password, dob, emergencyContact, workingHours, workingDays, isAdmin,
 * joined, and workload tracking fields (consultations, appointmentsManaged,
 * tasksCompleted, hoursWorked).
 *
 * When you call Admin.find(), Mongoose automatically filters by { role: 'Admin' },
 * so you will never accidentally get Doctor or Patient documents back.
 * =============================================================================
 */

const mongoose = require('mongoose');
const User = require('./UserBase');

const adminSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Staff name is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], select: false },
    dob: { type: String },
    emergencyContact: { type: String },
    workingHours: { type: String, default: '08:00 - 18:00' },
    workingDays: { type: String, default: 'Mon, Tue, Wed, Thu, Fri' },
    isAdmin: { type: Boolean, default: true },
    joined: { type: Date, default: Date.now },

    // Workload tracking fields for dashboard statistics
    consultations: { type: Number, default: 0 },
    appointmentsManaged: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    hoursWorked: { type: Number, default: 0 }
});

// Create 'Admin' as a discriminator of User with role = 'Admin'
const Admin = User.discriminator('Admin', adminSchema);

module.exports = Admin;
