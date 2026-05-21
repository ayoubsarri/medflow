/**
 * =============================================================================
 * ADMIN STAFF CONTROLLER — controllers/adminController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller handles all CRUD operations for Staff members. It is the
 * "C" in MVC — the Controller sits between the Route (URL) and the Model (DB).
 *
 * ROUTE → CONTROLLER → MODEL → DATABASE
 *
 * Updated from the original to:
 *   1. Accept all fields the frontend Add Staff modal sends.
 *   2. Write an audit log entry after each mutating operation.
 *   3. Protect admin accounts from deletion or disabling.
 *   4. Add a search endpoint for filtering staff by name/role.
 * =============================================================================
 */

const Doctor       = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const Admin        = require('../models/Admin');
const logAction = require('../utils/auditLogger');

// ─── 1. GET ALL STAFF ────────────────────────────────────────────────────────
/**
 * GET /api/admin/staff
 *
 * STUDENT DEFENSE NOTE:
 * `Staff.find({})` fetches every document in the 'staffs' collection.
 * The empty object `{}` is the "filter" — no filter means return everything.
 * We sort by `-joined` (descending) so the newest staff appear at the top.
 */
exports.getAllStaff = async (req, res) => {
    try {
        // .sort({ joined: -1 }) means newest first (-1 = descending order)
        const doctors = await Doctor.find({});
        const receptionists = await Receptionist.find({});
        const admins = await Admin.find({});
        
        const staff = [...doctors, ...receptionists, ...admins]
            .sort((a, b) => new Date(b.joined) - new Date(a.joined));
            
        res.status(200).json(staff);
    } catch (error) {
        // 500 = Internal Server Error. Something unexpected happened server-side.
        res.status(500).json({ message: 'Error fetching staff', error: error.message });
    }
};

// ─── 2. SEARCH STAFF ────────────────────────────────────────────────────────
/**
 * GET /api/admin/staff/search?q=ahmed
 *
 * STUDENT DEFENSE NOTE:
 * This endpoint uses a MongoDB `$regex` query — a "Regular Expression" that
 * works like a "contains" search. The `$options: 'i'` flag makes it
 * case-insensitive, so "ahmed" matches "Ahmed", "AHMED", etc.
 *
 * We search across `name`, `role`, and `email` simultaneously using `$or`.
 * `$or` means: return the document if ANY of the conditions is true.
 */
exports.searchStaff = async (req, res) => {
    try {
        const searchTerm = req.query.q || '';  // Read the search query from the URL

        // Build the search filter using $or and $regex
        const filter = {
            $or: [
                { name:  { $regex: searchTerm, $options: 'i' } },
                { role:  { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ]
        };

        const doctors = await Doctor.find(filter);
        const receptionists = await Receptionist.find(filter);
        const admins = await Admin.find(filter);

        const results = [...doctors, ...receptionists, ...admins].sort((a, b) => a.name.localeCompare(b.name));
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

// ─── 3. ADD NEW STAFF ───────────────────────────────────────────────────────
/**
 * POST /api/admin/add-staff
 * Body: { name, email, role, phone, dob, emergencyContact, workingHours, workingDays }
 *
 * STUDENT DEFENSE NOTE:
 * We destructure ALL fields from `req.body` — the JSON data sent from the
 * frontend Add Staff form. Previously, only `name`, `role`, `specialty` were
 * extracted, so `email`, `phone`, etc. were silently ignored!
 *
 * After saving, we call `logAction()` to write an audit trail. This way,
 * every new staff creation is permanently recorded.
 */
exports.addStaff = async (req, res) => {
    try {
        // Destructure every field the frontend's Add Staff modal sends.
        const {
            name, email, role, phone, dob,
            emergencyContact, workingHours, workingDays
        } = req.body;

        // Basic validation: name, email, and phone are required by the frontend.
        if (!name || !email || !phone) {
            // 400 = Bad Request. The client sent incomplete data.
            return res.status(400).json({ message: 'Name, email, and phone are required' });
        }

        let savedStaff;
        if (role === 'Doctor') {
            const newDoctor = new Doctor({ name, email, role, phone, dob, emergencyContact, workingHours: workingHours || '08:00 - 18:00', workingDays: workingDays || 'Mon, Tue, Wed, Thu, Fri', status: 'Active' });
            savedStaff = await newDoctor.save();
        } else if (role === 'Receptionist') {
            const newReceptionist = new Receptionist({ name, email, role, phone, dob, emergencyContact, workingHours: workingHours || '08:00 - 18:00', workingDays: workingDays || 'Mon, Tue, Wed, Thu, Fri', isAdmin: false });
            savedStaff = await newReceptionist.save();
        } else {
            const newAdmin = new Admin({ name, email, role, phone, dob, emergencyContact, workingHours: workingHours || '08:00 - 18:00', workingDays: workingDays || 'Mon, Tue, Wed, Thu, Fri', isAdmin: true });
            savedStaff = await newAdmin.save();
        }

        // Write an audit log AFTER the successful save.
        // We pass `req` so the logger can extract the IP address.
        await logAction(req, 'Admin', 'Admin', `Created staff account for ${name} (${role})`);

        // 201 = Created. More precise than 200 for a new resource.
        res.status(201).json(savedStaff);
    } catch (error) {
        // Common error here: duplicate email (MongoDB unique constraint violation, code 11000)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A staff member with this email already exists' });
        }
        res.status(500).json({ message: 'Error adding staff', error: error.message });
    }
};

// ─── 4. DELETE STAFF ────────────────────────────────────────────────────────
/**
 * DELETE /api/admin/delete-staff/:id
 *
 * STUDENT DEFENSE NOTE:
 * `req.params.id` reads the `:id` URL segment (e.g., /delete-staff/abc123).
 * We first find the staff member to:
 *   a) Confirm they exist (404 if not)
 *   b) Check if they are the admin (block if so)
 *   c) Log their name in the audit trail
 */
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the staff member first to check if they're an admin.
        let staffMember = await Doctor.findById(id);
        let Model = Doctor;
        if (!staffMember) {
            staffMember = await Receptionist.findById(id);
            Model = Receptionist;
        }
        if (!staffMember) {
            staffMember = await Admin.findById(id);
            Model = Admin;
        }

        if (!staffMember) {
            // 404 = Not Found.
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // BUSINESS RULE: The admin account is protected and cannot be deleted.
        if (staffMember.isAdmin) {
            // 403 = Forbidden. The requester is authenticated but not allowed to do this.
            return res.status(403).json({ message: 'Cannot delete the admin account' });
        }

        // Now that we've confirmed it's safe, delete the document.
        await Model.findByIdAndDelete(id);

        // Log the deletion for accountability.
        await logAction(req, 'Admin', 'Admin', `Deleted staff account: ${staffMember.name} (${staffMember.role})`);

        res.status(200).json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed', error: error.message });
    }
};

// ─── 5. TOGGLE STAFF STATUS ─────────────────────────────────────────────────
/**
 * PATCH /api/admin/toggle-status/:id
 *
 * STUDENT DEFENSE NOTE:
 * We use PATCH (not PUT) because we are only modifying ONE field (`status`),
 * not replacing the entire document. PATCH = partial update, PUT = full replace.
 *
 * The toggle logic is clean: if Active → Suspended, if Suspended → Active.
 * This is a "ternary operator" — a compact if/else written in one line.
 */
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let staffMember = await Doctor.findById(id);
        if (!staffMember) staffMember = await Receptionist.findById(id);
        if (!staffMember) staffMember = await Admin.findById(id);

        if (!staffMember) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // BUSINESS RULE: Admin accounts cannot be suspended.
        if (staffMember.isAdmin) {
            return res.status(403).json({ message: 'Cannot change the status of the admin account' });
        }

        // Ternary toggle: condition ? valueIfTrue : valueIfFalse
        staffMember.status = staffMember.status === 'Active' ? 'Suspended' : 'Active';

        // .save() updates only the changed field, not the entire document.
        await staffMember.save();

        // Log with the new status for clarity.
        const actionText = staffMember.status === 'Suspended'
            ? `Suspended staff account: ${staffMember.name}`
            : `Reactivated staff account: ${staffMember.name}`;

        await logAction(req, 'Admin', 'Admin', actionText);

        // Return the new status so the frontend can update the button/badge instantly.
        res.status(200).json({
            status: staffMember.status,
            message: 'Status updated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Status update failed', error: error.message });
    }
};


// ─── 6. GET STAFF SCHEDULE ────────────────────────────────────────────────────
/**
 * GET /api/admin/staff/:id/schedule
 *
 * STUDENT DEFENSE NOTE:
 * This returns the doctor's current saved schedule so the frontend modal can
 * pre-populate its fields (slotDuration, shiftStart, etc.) and render the
 * existing saved time cards instead of starting from scratch every time.
 *
 * We use `.select('name role schedule')` to return ONLY the three fields we
 * need — name, role, and the full schedule sub-document. This avoids sending
 * unnecessary data (phone, dob, etc.) across the network.
 */
exports.getStaffSchedule = async (req, res) => {
    try {
        let staffMember = await Doctor.findById(req.params.id).select('name role schedule workingDays');
        if (!staffMember) staffMember = await Receptionist.findById(req.params.id).select('name role schedule workingDays');
        if (!staffMember) staffMember = await Admin.findById(req.params.id).select('name role schedule workingDays');

        if (!staffMember) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.status(200).json(staffMember);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule', error: error.message });
    }
};


// ─── 7. UPDATE STAFF SCHEDULE (The Scheduling Algorithm) ─────────────────────
/**
 * PUT /api/admin/staff/:id/schedule
 * Body: { slotDuration, restInterval, shiftStart, shiftEnd, slots }
 *
 * WHERE `slots` is the final toggled array from the frontend:
 *   [{ startTime: "09:00", endTime: "09:30", status: "available" }, ...]
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STUDENT DEFENSE NOTE — THE TIME-SLOT + BUFFER ALGORITHM:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PROBLEM: A doctor works from 08:00 to 17:00. Each appointment is 30 minutes.
 * There is a 5-minute rest between sessions. How do we generate all valid slots?
 *
 * ALGORITHM (runs on the FRONTEND, validated on the BACKEND):
 *
 *   currentMinutes = timeToMinutes("08:00")  // = 480
 *   endMinutes     = timeToMinutes("17:00")  // = 1020
 *
 *   WHILE (currentMinutes + slotDuration) <= endMinutes:
 *     slotEnd = currentMinutes + slotDuration       // 480 + 30 = 510 → "08:30"
 *     SAVE slot { start: "08:00", end: "08:30" }
 *     currentMinutes = slotEnd + restInterval        // 510 + 5  = 515 → "08:35"
 *
 * WHY IS THE REST INTERVAL IMPORTANT?
 * In a real clinic, back-to-back appointments without breaks are dangerous:
 *   - The doctor has no time to write clinical notes.
 *   - The room cannot be sanitized between patients.
 *   - Islamic prayer times require periodic breaks.
 *   - Without buffers, a 5-minute delay cascades into hours of waiting.
 *
 * HOW DOES IT PREVENT OVERLAP?
 * The WHILE condition `(currentMinutes + slotDuration) <= endMinutes` ensures
 * we NEVER create a slot whose end time goes past the shift end. The loop simply
 * stops. No slot is created that would extend beyond the working day.
 *
 * WHO RUNS THE ALGORITHM?
 * The frontend runs the algorithm and sends the fully-generated slots array.
 * The backend receives them, validates the config, and saves.
 * This keeps the backend simple and the frontend interactive.
 * ─────────────────────────────────────────────────────────────────────────────
 */
exports.updateStaffSchedule = async (req, res) => {
    try {
        const { slotDuration, restInterval, shiftStart, shiftEnd, slots, workingDays } = req.body;

        // ── Basic Validation ────────────────────────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // We validate on the backend even though the frontend already validates.
        // Why? Because anyone can send a raw HTTP request to the API, bypassing
        // the frontend entirely. Backend validation is the last line of defense.

        if (!slotDuration || slotDuration < 5 || slotDuration > 120) {
            return res.status(400).json({ message: 'Slot duration must be between 5 and 120 minutes' });
        }
        if (restInterval < 0 || restInterval > 60) {
            return res.status(400).json({ message: 'Rest interval must be between 0 and 60 minutes' });
        }
        if (!shiftStart || !shiftEnd) {
            return res.status(400).json({ message: 'Shift start and end times are required' });
        }

        // ── Convert "HH:MM" to total minutes (helper) ───────────────────────────
        // STUDENT DEFENSE NOTE:
        // We work in MINUTES (integers) not strings to do time arithmetic.
        // "08:30" → 8 × 60 + 30 = 510 minutes since midnight.
        // This makes comparing and adding times trivial — no string parsing needed.
        const toMinutes = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const startMins = toMinutes(shiftStart);
        const endMins   = toMinutes(shiftEnd);

        if (startMins >= endMins) {
            return res.status(400).json({ message: 'Shift start must be before shift end' });
        }

        // ── Find the staff member ───────────────────────────────────────────────
        let staffMember = await Doctor.findById(req.params.id);
        if (!staffMember) staffMember = await Receptionist.findById(req.params.id);
        if (!staffMember) staffMember = await Admin.findById(req.params.id);
        if (!staffMember) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        // ── Save the schedule ───────────────────────────────────────────────────
        // We accept the frontend's slots array directly (it ran the algorithm).
        // The schema's enum validation ensures every status is 'available'|'blocked'.
        staffMember.schedule = {
            slotDuration,
            restInterval,
            shiftStart,
            shiftEnd,
            availableSlots: slots || []
        };
        
        if (workingDays !== undefined) {
            staffMember.workingDays = workingDays;
        }

        await staffMember.save();

        // Log the schedule update in the audit trail.
        await logAction(
            req, 'Admin', 'Admin',
            `Updated schedule for ${staffMember.name}: ${shiftStart}–${shiftEnd}, ${slotDuration}min slots, ${restInterval}min rest`
        );

        res.status(200).json({
            message: 'Schedule saved successfully',
            schedule: staffMember.schedule
        });

    } catch (error) {
        res.status(500).json({ message: 'Error saving schedule', error: error.message });
    }
};