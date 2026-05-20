const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    title: { type: String, required: true }, // "Appointment Confirmed"
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['Email', 'System'], 
        default: 'Email' 
    },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);