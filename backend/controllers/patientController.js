const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const jwt = require('jsonwebtoken');

/**
 * Handles the "Request Appointment" form for new patients.
 * Splits full name and creates both a Patient and an Appointment record.
 */
exports.registerPatient = async (req, res) => {
    try {
        const { fullName, email, phone, additionalNotes, doctorId, date, timeSlot } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: "Full name is required" });
        }
        if (!date) {
            return res.status(400).json({ message: "Appointment date is required" });
        }
        if (!timeSlot) {
            return res.status(400).json({ message: "Time slot is required" });
        }

        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const newPatient = new Patient({ firstName, lastName, email, phone, isExisting: false });
        const savedPatient = await newPatient.save();

        const newAppointment = new Appointment({
            patient: savedPatient._id,
            doctor: doctorId || undefined,
            date,
            timeSlot,
            additionalNotes,
            status: 'Pending'
        });
        await newAppointment.save();

        res.status(201).json({ message: "Request received successfully" });
    } catch (error) {
        console.error('registerPatient error:', error.message);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors).map(e => e.message).join(', ');
            return res.status(400).json({ message: msg });
        }
        res.status(500).json({ message: "Server error. Please try again.", details: error.message });
    }
};

/**
 * Handles login for patients using their unique File Number.
 */
exports.loginByFileCode = async (req, res) => {
    try {
        const { fileCode } = req.body;

        if (!fileCode) return res.status(400).json({ message: "File code is required" });

        const patient = await Patient.findOne({ fileCode: fileCode.trim() });

        if (!patient) {
            return res.status(404).json({ message: "Invalid File Number" });
        }

        const token = jwt.sign(
            { id: patient._id, role: 'Patient', name: `${patient.firstName} ${patient.lastName}` },
            process.env.JWT_SECRET || 'fallback_secret_key_for_development',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            patientId: patient._id,
            fullName: `${patient.firstName} ${patient.lastName}`
        });
    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({ error: "Login failed" });
    }
};

/**
 * Updates patient profile in settings */
exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Updates only the fields sent in the request 
        const updatedPatient = await Patient.findByIdAndUpdate(
            id, 
            { $set: req.body }, 
            { new: true } 
        );

        res.status(200).json({ message: "Profile updated", data: updatedPatient });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
};

/**
 * Handles appointment booking ( confirm appointment) for old patients
 */
exports.bookAppointmentInternal = async (req, res) => {
    try {
        const { patientId, doctorId, date, timeSlot, additionalNotes } = req.body;

        if (!patientId || !date || !timeSlot) {
            return res.status(400).json({ error: "patientId, date and timeSlot are required" });
        }

        const newAppointment = new Appointment({
            patient: patientId,
            doctor: doctorId || undefined,
            date: new Date(date),
            timeSlot,
            additionalNotes,
            status: 'Pending'
        });

        await newAppointment.save();

        res.status(201).json({ message: "Appointment booked! It is pending staff confirmation." });
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: "Failed to book appointment", details: error.message });
    }
};

/**
 * FETCH DASHBOARD DATA
 * Retrieves all upcoming appointments for thepatient
 */
exports.getDashboard = async (req, res) => {
    try {
        const { patientId } = req.params;

        const appointments = await Appointment.find({
            patient: patientId,
            status: { $nin: ['Cancelled', 'Completed', 'No Show', 'Absent'] }
        })
        .populate('doctor', 'name specialization')
        .sort({ date: 1 });

        // Shape the response to match what the frontend expects
        const shaped = appointments.map(apt => ({
            id: apt._id,
            doctor: apt.doctor?.name || 'TBD',
            specialty: apt.doctor?.specialization || apt.clinicName || 'Consultation',
            date: apt.date,
            timeSlot: apt.timeSlot,
            status: apt.status,
            additionalNotes: apt.additionalNotes,
        }));

        res.status(200).json(shaped);
    } catch (error) {
        console.error('getDashboard error:', error);
        res.status(500).json({ error: "Could not fetch dashboard data" });
    }
};

/**
 * CANCEL APPOINTMENT
 * Triggered by the "Cancel" button.
 * We change status to 'Cancelled' rather than deleting to keep a history record.
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        await Appointment.findByIdAndUpdate(appointmentId, { 
            status: 'Cancelled' 
        });

        res.status(200).json({ message: "Appointment cancelled successfully" });
    } catch (error) {
        res.status(500).json({ error: "Cancellation failed" });
    }
};

/**
 * FETCH CONSULTATION HISTORY
 * Retrieves past medical sessions where the patient sees prescriptions/justifications.
 */
exports.getConsultationHistory = async (req, res) => {
    try {
        const { patientId } = req.params;

        const history = await Appointment.find({
            patient: patientId,
            status: { $in: ['Completed', 'Checked-In', 'In Progress'] }
        })
        .populate('doctor', 'name specialization')
        .sort({ date: -1 });

        const shaped = history.map(apt => ({
            id: apt._id,
            date: apt.date,
            timeSlot: apt.timeSlot,
            doctor: apt.doctor?.name || 'Unknown Doctor',
            specialty: apt.doctor?.specialization || 'General',
            diagnosis: apt.additionalNotes || '—',
            status: apt.status,
        }));

        res.status(200).json(shaped);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: "Could not fetch history" });
    }
};

/**
 * UPLOAD OLD RECORD
 * Handles adding a file to the Old Records page.
 */
exports.uploadOldRecord = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { fileName, fileType, fileUrl } = req.body;

        const updatedPatient = await Patient.findByIdAndUpdate(
            patientId,
            { $push: { oldRecords: { fileName, fileType, fileUrl } } },
            { new: true }
        );

        res.status(200).json({ message: "File uploaded", data: updatedPatient.oldRecords });
    } catch (error) {
        res.status(500).json({ error: "Upload failed" });
    }
};

/**
 * GET OLD RECORDS
 * What it does: Retrieves a patient's uploaded old medical records.
 */
exports.getOldRecords = async (req, res) => {
    try {
        // Use the patientId from the URL params, or fallback to the logged-in user's ID
        const patientId = req.params.patientId || (req.user && req.user.id);

        if (!patientId) {
            return res.status(400).json({ error: "Patient ID is required" });
        }

        const patient = await Patient.findById(patientId);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json(patient.oldRecords || []);
    } catch (error) {
        console.error('Error fetching old records:', error);
        res.status(500).json({ error: "Could not fetch old records" });
    }
};

/**
 * GET PROFILE BY TOKEN
 * This is the "Who Am I?" function. 
 * Instead of taking an ID from the URL, it takes the ID from the secure JWT token.
 */
exports.getProfileByToken = async (req, res) => {
    try {
        // 'req.user.id' is set by your protect middleware after it unlocks the token[cite: 9]
        const patient = await Patient.findById(req.user.id);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // We send back exactly what the Sidebar and Settings need to show[cite: 4, 5]
        res.status(200).json({
            name: `${patient.firstName} ${patient.lastName}`,
            patientId: patient.fileCode || patient._id, // Uses your fileCode or DB ID
            email: patient.email,
            phone: patient.phone
        });
    } catch (error) {
        res.status(500).json({ error: "Could not retrieve profile" });
    }
};

/**
 * GET ALL PATIENTS
 * What it does: Returns all patients in the database. Supports optional search
 *   by name or email, filtering by status, and limiting results.
 * Input (query params): ?search=ahmed, ?status=Active, ?limit=1000
 * Returns: JSON array of patient objects, or an error message.
 */
exports.getAllPatients = async (req, res) => {
    try {
        const { search, status, limit } = req.query;

        // Build a dynamic filter object based on what the frontend sends
        const filter = {};

        // If a search term is provided, look for it in firstName, lastName, or email
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } },
            ];
        }

        // If a status filter is provided (e.g. 'Active'), add it to the filter
        if (status) {
            filter.status = status;
        }

        // Build the query; cap at 1000 rows if a limit is supplied
        let query = Patient.find(filter).sort({ createdAt: -1 });
        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const patients = await query;

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ success: false, error: 'Could not retrieve patient list' });
    }
};

/**
 * GET PATIENT BY ID
 * What it does: Fetches a single patient's full record using their MongoDB ID.
 * Input: URL param :id (the patient's MongoDB _id string)
 * Returns: A single patient JSON object, or 404 if not found, or 500 on error.
 */
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        const patient = await Patient.findById(id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ success: false, error: 'Could not retrieve patient' });
    }
};

/**
 * ADD PATIENT (Receptionist registration)
 * What it does: Creates a brand-new Active patient record directly from the
 *   receptionist's "Add Patient" form — no appointment is created at this step.
 *   Checks for duplicate email before saving to prevent double-registration.
 * Input (request body): { firstName, lastName, email, phone, dateOfBirth,
 *   chronicConditions, allergies, fileCode }
 * Returns: The newly created patient object, or an error message.
 */
exports.addPatient = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            chronicConditions,
            allergies,
            hereditaryConditions,
            emergencyNumber,
            fileCode,
        } = req.body;

        // Validate that the two mandatory fields are present
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        // Prevent duplicate registrations by checking for an existing email
        if (email) {
            const existing = await Patient.findOne({ email: email.toLowerCase() });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'A patient with this email already exists'
                });
            }
        }

        // Create the patient with status 'Active' — receptionist-registered
        // patients are active immediately (no pending review needed)
        const newPatient = new Patient({
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            chronicConditions,
            allergies,
            hereditaryConditions,
            emergencyNumber,
            fileCode,
            isExisting: true,
            status: 'Active'
        });

        const saved = await newPatient.save();

        res.status(201).json({
            success: true,
            message: 'Patient registered successfully',
            data: saved
        });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ success: false, error: 'Could not register patient', details: error.message });
    }
};

/**
 * UPDATE PATIENT (Receptionist edit)
 * What it does: Updates any fields on an existing patient record.
 *   Only the fields sent in the request body are changed; everything else
 *   stays the same. Uses MongoDB $set so partial updates are safe.
 * Input: URL param :id, plus any patient fields in the request body
 * Returns: The updated patient object, or 404 if not found, or 500 on error.
 */
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;

        // { new: true } makes Mongoose return the document AFTER the update,
        // not the old version — so the frontend immediately sees the new data.
        const updated = await Patient.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ success: false, error: 'Could not update patient', details: error.message });
    }
};
