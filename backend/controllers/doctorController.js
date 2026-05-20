const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');


exports.getDoctorDashboard = async (req, res) => {
    try {
        // Accept doctorId (preferred) or fall back to req.user.id from JWT
        const doctorId = req.query.doctorId || req.user?.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointments = await Appointment.find({
            doctor: doctorId,
            date: { $gte: today },
            status: { $in: ['Checked-In', 'Completed'] }
        }).populate('patient', 'firstName lastName dateOfBirth fileCode phone allergies chronicConditions');

        // Sorting: Checked-In at the top, Completed at the bottom
        const sortedSchedule = appointments.sort((a, b) => {
            if (a.status === 'Completed' && b.status === 'Checked-In') return 1;
            if (a.status === 'Checked-In' && b.status === 'Completed') return -1;
            return 0;
        });

        // Statistics for the top cards
        const summary = {
            today: appointments.length,
            waiting: appointments.filter(a => a.status === 'Checked-In').length,
            completed: appointments.filter(a => a.status === 'Completed').length
        };

        res.status(200).json({ schedule: sortedSchedule, summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * SAVE CONSULTATION
 * Triggered by the "Save" button 
 */
exports.saveConsultation = async (req, res) => {
    try {
        const { 
            appointmentId, 
            patientId, 
            notes, 
            prescription, 
            medicalJustification, 
            followUpDate,
            requestedDocuments 
        } = req.body;

        // Create the permanent medical record
        const newConsultation = new Consultation({
            appointmentId,
            patientId,
            notes,
            prescription,
            medicalJustification,
            followUpDate,
            requestedDocuments
        });
        await newConsultation.save();

        // Update appointment status to 'Completed'
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'Completed' });

        res.status(201).json({ message: "Consultation finalized and saved." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 *  RESCHEDULE APPOINTMENT
 * Triggered by the Orange Refresh Icon 
 */
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { newDate, newTime } = req.body;

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { date: newDate, timeSlot: newTime, status: 'Confirmed' }, 
            { new: true }
        );

        res.status(200).json({ message: "Appointment moved to new slot.", updatedAppointment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 *  CANCEL/DELETE APPOINTMENT
 * Triggered by the Red Trash Icon
 */
exports.deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        // Change status to 'Cancelled' for record-keeping
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'Cancelled' });

        res.status(200).json({ message: "Appointment removed from schedule." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 *  GET PATIENT HISTORY
 * Loads the "Past Visits" and "Medical Records" 
 */
exports.getPatientMedicalHistory = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Find all previous consultations for this specific patient
        const history = await Consultation.find({ patientId })
            .sort({ date: -1 }) 
            .limit(10);

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { generateMedicalPDF } = require('../utils/pdfGenerator');

//  PRINT PRESCRIPTION
exports.printPrescription = async (req, res) => {
    const { appointmentId, textContent } = req.body;
    const appointment = await Appointment.findById(appointmentId).populate('patientId');
    
    const data = {
        doctorName: appointment.doctorName, 
        specialty: appointment.doctorSpecialty || "General Medicine", // Pulls from DB
        patientName: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
        fileCode: appointment.patientId.fileCode,
        textContent: textContent // The text from the textarea 
    };

    generateMedicalPDF(res, data, 'Prescription');
};

// PRINT JUSTIFICATION
exports.printJustification = async (req, res) => {
    const { appointmentId, textContent } = req.body;
    const appointment = await Appointment.findById(appointmentId).populate('patientId');

    const data = {
        doctorName: appointment.doctorName,
        specialty: appointment.doctorSpecialty || "General Medicine",
        patientName: `${appointment.patientId.firstName} ${appointment.patientId.lastName}`,
        fileCode: appointment.patientId.fileCode,
        textContent: textContent 
    };

    generateMedicalPDF(res, data, 'Medical Justification');
};

/**
 * GET SCHEDULE BY DATE RANGE
 * Used for the Weekly and Monthly calendar views.
 * Shows all Confirmed appointments 
 */
exports.getScheduleByRange = async (req, res) => {
    try {
        const doctorId = req.query.doctorId || req.user?.id;
        const { startDate, endDate } = req.query;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const schedule = await Appointment.find({
            doctor: doctorId,
            status: { $in: ['Confirmed', 'Checked-In', 'In Progress', 'Pending'] },
            date: { $gte: start, $lte: end }
        })
        .populate('patient', 'firstName lastName')
        .sort({ date: 1, timeSlot: 1 });

        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch calendar schedule" });
    }
};

/**
 * GET MY PATIENTS LIST
 * Fetches all patients attached to the logged-in doctor through appointments,
 * and returns unique patient records with summary stats for each card.
 */
exports.getMyPatients = async (req, res) => {
    try {
        const doctorId = req.user?.id;
        const search = (req.query.search || "").toLowerCase();

        // Use doctor object reference when available, otherwise fall back to stored doctorName.
        const query = doctorId
            ? { $or: [{ doctor: doctorId }, { doctorName: req.user?.name }] }
            : { doctorName: req.user?.name };

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName dateOfBirth fileCode phone allergies chronicConditions');

        const patientMap = new Map();

        appointments.forEach((app) => {
            const p = app.patient;
            if (!p || !p._id) return;

            const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim();
            if (search && !fullName.toLowerCase().includes(search)) return;

            const patientKey = p._id.toString();
            const visitDate = app.date ? new Date(app.date) : null;
            const lastVisit = visitDate ? visitDate.toISOString().split('T')[0] : null;

            if (!patientMap.has(patientKey)) {
                patientMap.set(patientKey, {
                    id: patientKey,
                    name: fullName || 'Unknown patient',
                    age: p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : null,
                    lastVisit,
                    visits: 1,
                    contact: p.phone || ''
                });
            } else {
                const existing = patientMap.get(patientKey);
                existing.visits += 1;
                if (lastVisit && (!existing.lastVisit || new Date(lastVisit) > new Date(existing.lastVisit))) {
                    existing.lastVisit = lastVisit;
                }
            }
        });

        res.status(200).json({ data: Array.from(patientMap.values()) });
    } catch (error) {
        res.status(500).json({ error: "Failed to load patient list" });
    }
};

/**
 * GET FULL PATIENT PROFILE
 * Loads everything for the detailed modal views.
 */
exports.getDetailedPatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;

        // 1. Get Basic Info & Old Records (from Patient Model)
        const patient = await Patient.findById(patientId);

        // 2. Get all Consultations (for Visit History & Justifications)
        const consultations = await Consultation.find({ patientId }).sort({ date: -1 });

        res.status(200).json({
            profile: {
                name: `${patient.firstName} ${patient.lastName}`,
                age: new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear(),
                phone: patient.phone,
                allergies: patient.allergies,
                chronicConditions: patient.chronicConditions,
                hereditaryConditions: patient.hereditaryConditions,
            },
            visitHistory: consultations.map(c => ({
                date: c.date,
                reason: c.notes?.substring(0, 30) + "...", // Short preview
                details: c.notes
            })),
            medicalRecords: patient.oldRecords, // Lab reports, Imaging, etc.
            justifications: consultations
                .filter(c => c.medicalJustification)
                .map(c => ({
                    date: c.date,
                    text: c.medicalJustification
                }))
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to load detailed profile" });
    }
};

/**
 * GET ALL JUSTIFICATIONS
 * Fetches every consultation that contains a medical justification.
 */
exports.getAllJustifications = async (req, res) => {
    try {
        const { doctorName, search, date } = req.query;

        // 1. Build the query
        let query = { 
            // We only want consultations that HAVE a justification text
            medicalJustification: { $exists: true, $ne: "" } 
        };

        // 2. Fetch and Populate
        const justifications = await Consultation.find(query)
            .populate({
                path: 'appointmentId',
                match: { doctorName: doctorName } // Only for this doctor
            })
            .populate('patientId', 'firstName lastName');

        // 3. Filter out consultations that belong to other doctors after population
        const filtered = justifications.filter(j => j.appointmentId !== null);

        // 4. Apply Search (by patient name) or Date filter if provided
        const finalData = filtered.filter(j => {
            const matchesSearch = search ? 
                (`${j.patientId.firstName} ${j.patientId.lastName}`).toLowerCase().includes(search.toLowerCase()) : true;
            const matchesDate = date ? 
                new Date(j.date).toDateString() === new Date(date).toDateString() : true;
            return matchesSearch && matchesDate;
        });

        res.status(200).json(finalData);
    } catch (error) {
        res.status(500).json({ error: "Failed to load justification archive" });
    }
};

/**
 * GET ALL PATIENT NAMES
 * Simple list for the "Select Patient" dropdown in the form.
 */
exports.getPatientDropdown = async (req, res) => {
    try {
        const patients = await Patient.find({}, 'firstName lastName');
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ error: "Could not load patient list" });
    }
};

/**
 * create new justification from the second page
 */
exports.addNewJustification = async (req, res) => {
    try {
        const { 
            patientId, 
            reason, 
            startDate, 
            numberOfDays, 
            justificationContent 
        } = req.body;

        // Create the record
        const newJustification = new Consultation({
            patientId,
            notes: reason, // We store the "Reason" in the notes for the archive
            date: startDate || Date.now(),
            medicalJustification: justificationContent,
            // We can add a custom field to the schema or append it to the content
            durationDays: numberOfDays 
        });

        await newJustification.save();

        res.status(201).json({ 
            message: "Justification created successfully!",
            data: newJustification 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create justification" });
    }
};

/**
 * save profile changes except date of birth
 */
exports.updateDoctorProfile = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        // We only pull the editable fields from the request body
        const { 
            fullName, 
            email, 
            phone, 
            emergencyContact, 
            address,
            specialty 
        } = req.body;

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            doctorId,
            { 
                fullName, 
                email, 
                phone, 
                emergencyContact, 
                address,
                specialty
            },
            { new: true } 
        );

        res.status(200).json({ 
            message: "Settings saved successfully!", 
            doctor: updatedDoctor 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to save settings" });
    }
};

/**
 * GET PUBLIC DOCTORS
 * Simple list of active doctors for the public patient form.
 */
exports.getPublicDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({ status: 'Active' }, 'name specialty specialization');
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        res.status(500).json({ error: "Could not load doctor list" });
    }
};