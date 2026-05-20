const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // Link to the specific patient record
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },

    // Link to the doctor
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    
    // Default clinic name 
    clinicName: { type: String, default: 'Central Clinic' },

    // Date and time slot selected by the patient
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, 

    // Appointment duration in minutes
    duration: { type: Number, default: 30 },

    // Additional Notes
    additionalNotes: { type: String },

    // Status 
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Cancelled', 'Checked-In', 'Completed', 'No Show', 'Arrived', 'In Progress', 'Absent'],
        default: 'Pending'
    }
}, { 
    // Automatically tracks when the appointment was created
    timestamps: true 
});

module.exports = mongoose.model('Appointment', appointmentSchema);