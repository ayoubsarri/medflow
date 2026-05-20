// i started this after the new class diagram
const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
    // Link to the appointment this consultation belongs to
    appointment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    // Link to the patient so we can fetch their history
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorName: String,
    date: String, // e.g., "March 20, 2024"
    time: String,
    prescriptionFile: String, // Stores the path to the PDF
    justificationFile: String, 
    followUpDate: Date,
    // Array for the extra attachments you saw in the UI
    attachments: [String] 
});

module.exports = mongoose.model('Consultation', ConsultationSchema);