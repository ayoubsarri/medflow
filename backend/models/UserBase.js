/**
 * =============================================================================
 * USER BASE MODEL — models/UserBase.js
 * =============================================================================
 *
 * WHAT IS A MONGOOSE DISCRIMINATOR?
 * A Mongoose Discriminator lets multiple models (Admin, Doctor, Receptionist,
 * Patient) share a single MongoDB collection while each having its own unique
 * fields and validation rules. When you query Doctor.find(), Mongoose
 * automatically adds { role: 'Doctor' } to the filter so you only get doctors.
 *
 * WHY WE USE IT:
 * Before this, all four models manually pointed to the 'users' collection using
 * mongoose.model('Doctor', schema, 'users'). That caused query interference —
 * Doctor.find() could return Admin documents because Mongoose had no way to
 * tell them apart. Discriminators solve this by adding an automatic role filter
 * to every query made through a child model.
 *
 * SHARED FIELDS:
 * Only fields that exist on ALL four roles belong here. Role-specific fields
 * (like Doctor's schedule or Patient's allergies) go in their own model files.
 * =============================================================================
 */

const mongoose = require('mongoose');

const userBaseSchema = new mongoose.Schema({

    // --- Fields shared by ALL four roles ---

    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true },
    status: { type: String, default: 'Active' },

}, {
    // The discriminatorKey tells Mongoose which field determines the sub-type.
    // Every document in 'users' will have a 'role' field like 'Doctor' or 'Patient'.
    discriminatorKey: 'role',

    // All four old models wrote to the 'users' collection — this keeps it the same.
    collection: 'users',

    // Adds createdAt and updatedAt automatically to every document.
    timestamps: true
});

// --- Pre-Save Hook for Password Hashing (applies to all roles that have a password field) ---
// Admin & Receptionist previously had their own identical hooks — we define it once here.
userBaseSchema.pre('save', async function (next) {
    // Only hash if the document has a 'password' field and it was changed
    if (!this.password || !this.isModified('password')) return next();
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// This is the base model. Child models (Admin, Doctor, etc.) call User.discriminator().
const User = mongoose.model('User', userBaseSchema);

module.exports = User;
