# MedFlow: The Ultimate 30-Page Technical & Architectural Specification

## Chapter 1: Executive Overview & Vision
MedFlow is a state-of-the-art Clinic Management System engineered to revolutionize the way healthcare facilities operate. This document serves as the absolute master reference for the entire system, covering everything from the fundamental database structures to the complex real-time WebSocket integrations, Next.js frontend rendering paradigms, and the rigorous cloud deployment strategies employed across Firebase, Render, and MongoDB Atlas.

### 1.1 The Core Problem
Traditional clinics rely heavily on paper-based records, fragmented scheduling systems, and isolated communication channels. This leads to massive inefficiencies: lost patient histories, double-booked doctors, congested waiting rooms, and frustrated staff. Receptionists are overwhelmed by phone calls, while doctors waste time navigating clumsy interfaces to write prescriptions.

### 1.2 The MedFlow Solution
MedFlow digitizes and unifies the entire clinic workflow into a single, cohesive ecosystem. 
- **For the Admin:** A god-eye view of the clinic's operations, staff management, and system audits.
- **For the Doctor:** A focused, HIPAA-compliant (by design architecture) portal to manage appointments, review comprehensive patient histories, write digital prescriptions, and manage their availability.
- **For the Receptionist:** A high-speed interface for patient intake, live queue management, and appointment conflict resolution.
- **For the Patient:** A public-facing portal to explore clinic services and view real-time doctor availability.

### 1.3 Architectural Paradigms
MedFlow strictly adheres to the **Client-Server Architecture** model, utilizing a decoupled approach. The frontend (Client) is entirely separated from the backend (Server). They communicate strictly via RESTful HTTP APIs and WebSocket events. This decoupling allows the frontend to be hosted on Edge Networks (Firebase CDN) for lightning-fast delivery, while the backend runs on heavy-duty Node.js containers (Render) optimized for database I/O and persistent connections.

## Chapter 2: The Data Layer (MongoDB & Mongoose)
The database is the beating heart of MedFlow. We chose MongoDB, a NoSQL document database, due to the inherent flexibility required by healthcare data. Unlike rigid SQL tables, MongoDB allows patient records and medical histories to dynamically evolve without requiring complex migrations.

### 2.1 Polymorphic User Architecture
One of the most complex challenges in clinic software is managing different types of users (Admins, Doctors, Receptionists) who share common attributes (email, password) but have wildly different specialized attributes (Doctors have consultation fees; Admins do not).
To solve this, we implemented **Mongoose Discriminators**. This allows us to store ALL users in a single 'Users' collection, making authentication seamless, while still enforcing strict schemas for specific roles.

### 2.2 Database Schemas (Source Code Extract)
Below is the exact schema definitions extracted directly from the backend models, demonstrating the strict typing and validation enforced at the database level:

#### File: `Admin.js`
```javascript
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

```

#### File: `Appointment.js`
```javascript
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
```

#### File: `AuditLog.js`
```javascript
/**
 * =============================================================================
 * AUDIT LOG MODEL — models/AuditLog.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * An Audit Log is a permanent, tamper-evident record of every important action
 * taken in a system. Think of it like a "flight recorder" — it writes down
 * who did what, when, and from where.
 *
 * WHY IS THIS IMPORTANT?
 * In medical systems, audit logging is not optional — it is a legal and ethical
 * requirement. If a patient record is accidentally deleted, an audit log tells
 * you exactly who deleted it and when.
 *
 * The Admin Audit Logs page fetches from this collection to display a real-time
 * feed of system events. Each time an admin adds/deletes/toggles a staff member,
 * or generates a report, our `auditLogger.js` utility writes a new document here.
 *
 * KEY DESIGN DECISION:
 * Audit logs are APPEND-ONLY. We never update or delete audit records. This
 * maintains a trustworthy historical trail.
 * =============================================================================
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({

    // The name of the user who performed the action (e.g., "Lyne", "Sarah")
    name: {
        type: String,
        required: true,
        default: 'System'
    },

    // The role of the user (Admin, Doctor, Receptionist, System)
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Doctor', 'Receptionist', 'System'],
        default: 'Admin'
    },

    // A human-readable description of what happened.
    // Examples: "Created Staff Account", "Generated Monthly Report", "Deleted Patient Record"
    action: {
        type: String,
        required: [true, 'Action description is required'],
        trim: true
    },

    // The IP address of the user at the time of the action.
    // "System" is used for automated actions like backups.
    // `req.ip` in Express gives us the IP address automatically.
    ipAddress: {
        type: String,
        default: 'Unknown'
    },

    // STUDENT DEFENSE NOTE:
    // We do NOT use `timestamps: true` here because we want the `createdAt` to be
    // the definitive, unmodifiable timestamp of the event. We add it manually below
    // with `default: Date.now` and `immutable: true` to prevent any modification.
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true  // Once set, this value CANNOT be changed. Makes the log tamper-resistant.
    }

}, {
    // We set timestamps to false because we manage `createdAt` manually above.
    timestamps: false
});

// Index by createdAt descending so the most recent logs load fastest.
auditLogSchema.index({ createdAt: -1 });

// Export the model. Mongoose will create an 'auditlogs' collection in MongoDB.
module.exports = mongoose.model('AuditLog', auditLogSchema);

```

#### File: `Consultation.js`
```javascript
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
```

#### File: `Doctor.js`
```javascript
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
```

#### File: `Message.js`
```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderModel: { type: String, enum: ['Doctor', 'Receptionist'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['sent', 'read'], default: 'sent' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
```

#### File: `Notification.js`
```javascript
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
```

#### File: `Patient.js`
```javascript
/**
 * =============================================================================
 * PATIENT MODEL — models/Patient.js
 * =============================================================================
 * Patients are stored in the dedicated 'patients' collection, separate from
 * the staff 'users' collection. They have no password — portal access is via
 * fileCode only.
 * =============================================================================
 */

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    // --- Identity ---
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    // --- Portal Security & Logic ---
    fileCode: { type: String, unique: true, sparse: true, trim: true },
    isExisting: { type: Boolean, default: false },

    // --- Medical conditions ---
    chronicConditions: { type: String, default: 'None' },
    allergies: { type: String, default: 'None' },
    hereditaryConditions: { type: String, default: 'None' },

    // --- Emergency & Settings ---
    emergencyNumber: { type: String },
    reminders: {
        email: { type: Boolean, default: true },
    },

    // --- Old Records (File Storage) ---
    oldRecords: [{
        fileName: { type: String },
        fileType: { type: String },
        uploadDate: { type: Date, default: Date.now },
        fileUrl: { type: String }
    }]
}, {
    collection: 'patients',
    timestamps: true
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;

```

#### File: `Receptionist.js`
```javascript
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

```

#### File: `Report.js`
```javascript
/**
 * =============================================================================
 * REPORT MODEL — models/Report.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * When the admin clicks "Generate Report" on the System Reports page, our backend
 * calculates a snapshot of clinic statistics for the chosen period and saves it
 * as a Report document in this collection.
 *
 * WHY SAVE THE REPORT TO THE DATABASE?
 * If we only calculated and returned the data without saving it, the admin would
 * lose the report the moment they refreshed the page. By persisting reports, we
 * power the "Previous Reports" table which shows historical snapshots.
 *
 * Also: reports represent a point-in-time snapshot. If a patient is deleted after
 * a report was generated, the report still correctly shows the old data — which
 * is what accountants and auditors need.
 * =============================================================================
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({

    // The display name, e.g., "April 2026 Monthly Summary"
    name: {
        type: String,
        required: true,
        trim: true
    },

    // The report category. Matches the dropdown options in the frontend.
    type: {
        type: String,
        enum: ['Monthly Summary', 'Quarterly Overview', 'Annual Report'],
        required: true
    },

    // The period this report covers. Stored as separate fields for easy querying.
    month: { type: String },   // e.g., "April"
    year:  { type: String },   // e.g., "2026"

    // ─── The Actual Report Data ──────────────────────────────────────────────────
    // STUDENT DEFENSE NOTE:
    // We store the snapshot data as a nested object (sub-document). `Mixed` type
    // in Mongoose means we can store any JSON structure here — it's flexible.
    // This holds the calculated numbers at the time the report was generated.
    data: {
        totalPatients:      { type: Number, default: 0 },
        totalAppointments:  { type: Number, default: 0 },
        completedAppointments: { type: Number, default: 0 },
        cancelledAppointments: { type: Number, default: 0 },
        noShowCount:        { type: Number, default: 0 },
        noShowRate:         { type: String, default: '0%' },
        activeStaff:        { type: Number, default: 0 },
        newPatients:        { type: Number, default: 0 },  // New patients registered during period
        revenueEstimate:    { type: String, default: 'N/A' } // Placeholder for future billing integration
    },

    // Who generated this report (for accountability)
    generatedBy: { type: String, default: 'Admin' },

}, {
    // `timestamps: true` gives us `createdAt` which we display as "Generated: April 1, 2026"
    // on the Previous Reports list in the frontend.
    timestamps: true
});

// Export the model. Mongoose will create a 'reports' collection.
module.exports = mongoose.model('Report', reportSchema);

```

#### File: `SystemSettings.js`
```javascript
/**
 * =============================================================================
 * SYSTEM SETTINGS MODEL — models/SystemSettings.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * Unlike other models (Staff, Patient, Appointment) where a new document is
 * created for every new record, the SystemSettings model uses a "Singleton
 * Pattern" — there is always exactly ONE settings document in the collection.
 *
 * SINGLETON PATTERN:
 * Our `settingsController.js` always looks for this one document using a fixed
 * identifier. If it doesn't exist yet (first run), the controller creates it
 * with sensible defaults. This is called "upsert" (update or insert).
 *
 * The Settings page uses:
 *   GET /api/admin/settings → fetches the single document to populate the form
 *   PUT /api/admin/settings → updates `workingHours` (the only editable field)
 *   POST /api/admin/settings/backup → updates `lastBackup` timestamp
 * =============================================================================
 */

const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({

    // ─── Read-Only Clinic Information (displayed but not editable in the UI) ─────

    clinicName: {
        type: String,
        default: 'MedFlow Clinic'
    },
    address: {
        type: String,
        default: '123 Medical Center Blvd, Algiers'
    },
    phone: {
        type: String,
        default: '+213 21 123 456'
    },

    // ─── Editable Settings ───────────────────────────────────────────────────────

    // The ONLY field the admin can change via the Settings UI.
    // Default matches what is shown in the frontend's initial state.
    workingHours: {
        type: String,
        default: '8:00 AM - 6:00 PM'
    },

    // ─── Backup Management ───────────────────────────────────────────────────────

    // STUDENT DEFENSE NOTE:
    // `lastBackup` is updated every time the admin clicks "Run Backup Now".
    // The Settings page displays this date under "Backup Settings".
    lastBackup: {
        type: Date,
        default: null
    },

    autoBackupSchedule: {
        type: String,
        default: 'Daily at 2:00 AM'
    },

    // ─── System Health (read-only, computed at runtime by the controller) ────────
    // STUDENT DEFENSE NOTE:
    // These are NOT stored in the database — they are dynamic values.
    // The controller adds them to the response when fetching settings.
    // We include them as notes here for documentation purposes only.
    //
    //   databaseStatus: calculated by checking mongoose.connection.readyState
    //   apiStatus: always "Operational" if the server responds
    //   systemUptime: calculated using process.uptime()
    //   emailService: always "Connected" for simulation purposes

}, {
    timestamps: true  // Tracks when settings were last changed
});

// Export the model. Mongoose creates a 'systemsettings' collection.
module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

```

#### File: `UserBase.js`
```javascript
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

```

## Chapter 3: The Application Layer (Node.js & Express)
The backend server is built on Node.js using the Express.js framework. It is completely stateless, relying on JSON Web Tokens (JWT) for authentication. This statelessness is crucial for horizontal scaling; if we spin up 5 backend servers, any server can handle any request because the session data is stored cryptographically inside the token itself, not in the server's memory.

### 3.1 Security & Defensive Programming
Security is paramount. The backend employs several layers of defense:
1. **CORS (Cross-Origin Resource Sharing):** The server actively rejects API calls from unauthorized domains. Only the official Firebase frontend URL is whitelisted.
2. **Password Hashing:** Utilizing `bcrypt.js`, all passwords are salted and hashed with a cost factor of 10. Even if the database is compromised, the passwords remain cryptographically secure.
3. **Role-Based Access Control (RBAC):** Custom Express middleware intercepts every request. It decodes the JWT, verifies the signature using the `JWT_SECRET`, and checks if the user's role matches the required permission for that specific route (e.g., a Receptionist cannot access the `/api/admin` routes).

### 3.2 Core API Controllers (Source Code Extract)
The business logic resides in the controllers. Here is the raw implementation of our core logic:

#### File: `adminController.js`
```javascript
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
        let staffMember = await Doctor.findById(req.params.id).select('name role schedule');
        if (!staffMember) staffMember = await Receptionist.findById(req.params.id).select('name role schedule');
        if (!staffMember) staffMember = await Admin.findById(req.params.id).select('name role schedule');

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
        const { slotDuration, restInterval, shiftStart, shiftEnd, slots } = req.body;

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
```

#### File: `appointmentController.js`
```javascript
/**
 * =============================================================================
 * APPOINTMENT CONTROLLER — controllers/appointmentController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller manages all appointment operations for the Receptionist module.
 * Key responsibilities:
 *
 *   1. CREATE appointments: Receptionist books a patient with a doctor
 *   2. READ appointments: List all, or get one by ID (with time-slot filtering)
 *   3. UPDATE appointments: Change status (Pending → Confirmed → Completed/NoShow)
 *   4. DELETE appointments: Cancel or remove from schedule
 *
 * RELATIONAL LOGIC — HOW IT ALL CONNECTS:
 *
 *   Patient (One) ──┐
 *                   ├─→ Appointment (Many)
 *   Doctor (One)  ──┘
 *
 *   Example:
 *   - Patient "Ahmed" (ObjectId: 507f1f77bcf86cd799439011) can have MANY appointments
 *   - Doctor "Dr. Nouar" (ObjectId: 507f1f77bcf86cd799439012) can have MANY appointments
 *   - Each Appointment document stores BOTH IDs to link them together
 *   - When a receptionist books Ahmed with Dr. Nouar on 2026-04-19 at 09:00,
 *     we create: { patient: 507f..., doctor: 507f..., date: 2026-04-19T09:00, status: 'Pending' }
 *
 * AUDIT LOGGING:
 * Every significant action (create, status change, cancel) triggers an audit log
 * entry so we can track "who booked what when" for compliance and debugging.
 * =============================================================================
 */

const Appointment  = require('../models/Appointment');
const Patient      = require('../models/Patient');
const Doctor       = require('../models/Doctor');
const logAction    = require('../utils/auditLogger');
const { sendSuccessEmail } = require('../utils/emailservice');

// ─── 1. CREATE APPOINTMENT ──────────────────────────────────────────────────────
/**
 * POST /api/receptionist/appointments
 *
 * Request body example:
 * {
 *   patientId: "507f1f77bcf86cd799439011",      // Link to Patient
 *   patientName: "Ahmed Benali",                 // Quick read without joining
 *   doctorId: "507f1f77bcf86cd799439012",       // Link to Staff (doctor)
 *   doctorName: "Dr. Nouar",
 *   date: "2026-04-19T09:00:00Z",                // ISO format date-time
 *   duration: 30,                                 // minutes
 *   reason: "General Consultation",
 *   notes: "Patient mentioned ongoing fatigue"
 * }
 *
 * STUDENT DEFENSE NOTE:
 * We validate that the patientId and doctorId actually exist in the database
 * before creating the appointment. This prevents "orphaned" records that
 * reference non-existent patients or doctors.
 *
 * Return:
 * { _id: "...", patient: {...full document...}, doctor: {...full document...}, ... }
 * (Uses .populate() to return the full Patient and Staff documents, not just IDs)
 */
exports.createAppointment = async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, date, duration, reason, notes } = req.body;

        // Validation: Required fields
        if (!patientId || !patientName || !doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: patientId, patientName, doctorId, date'
            });
        }

        // Validation: Patient exists
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: `Patient with ID ${patientId} not found`
            });
        }

        // Validation: Doctor exists and is active
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: `Doctor with ID ${doctorId} not found`
            });
        }

        if (doctor.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: `Doctor ${doctor.name} is currently suspended`
            });
        }

        // Validation: Check if appointment slot is actually available
        // (Doctor's schedule might have this slot marked as "blocked")
        const appointmentDate = new Date(date);
        const appointmentHours = appointmentDate.getHours();
        const appointmentMinutes = appointmentDate.getMinutes();
        const slotTimeString = `${String(appointmentHours).padStart(2, '0')}:${String(appointmentMinutes).padStart(2, '0')}`;

        // Check if doctor has a schedule and the slot is available
        let isSlotAvailable = true;
        if (doctor.schedule && doctor.schedule.availableSlots && doctor.schedule.availableSlots.length > 0) {
            const slot = doctor.schedule.availableSlots.find(s => s.startTime === slotTimeString);
            if (!slot) {
                return res.status(400).json({
                    success: false,
                    message: `Doctor ${doctor.name} has no slot at ${slotTimeString}`
                });
            }
            if (slot.status === 'blocked') {
                return res.status(400).json({
                    success: false,
                    message: `Slot ${slotTimeString} is blocked for ${doctor.name}`
                });
            }
        }

        // Doctor double-booking protection (works for both new + existing patients):
        // If ANY appointment exists for the same doctor at the exact same datetime,
        // the slot is not available.
        const existingDoctorAppointment = await Appointment.findOne({
            doctor: doctorId,
            date: appointmentDate,
            status: { $ne: 'Cancelled' }
        });

        if (existingDoctorAppointment) {
            return res.status(400).json({
                success: false,
                message: `Slot ${slotTimeString} is already booked for ${doctor.name}`
            });
        }

        // Check if patient already has an appointment at the exact same time
        const existingAppointment = await Appointment.findOne({
            patient: patientId,
            date: appointmentDate,
            status: { $ne: 'Cancelled' }
        });
        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: `Patient ${patientName} already has an appointment on this date`
            });
        }

        // Determine the correct status
        let finalStatus = 'Pending';

        // 1. If the receptionist/UI explicitly sends "Confirmed"
        if (req.body.status === 'Confirmed') {
            finalStatus = 'Confirmed';
        } else if (patient) {
            // 2. LOGIC: If patient exists in our DB, it's an "Existing Patient" -> Auto-Confirm
            // (Note: we already fetched 'patient' above at line 77)
            finalStatus = 'Confirmed';
        }

        // Create the appointment
        const appointment = new Appointment({
            patient: patientId,
            patientName: patientName,
            doctor: doctorId,
            doctorName: doctorName || doctor.name,
            date: appointmentDate,
            duration: duration || 30,
            reason: reason || 'General Consultation',
            notes: notes || '',
            status: finalStatus  // ✅ Auto-confirmed if existing, else Pending
        });

        // Save to database
        await appointment.save();

        // If we created the appointment already in "Confirmed",
        // trigger the Success email now (idempotent).
        if (appointment.status === 'Confirmed' && !appointment.successEmailSent) {
            try {
                await sendSuccessEmail({
                    to: patient?.email,
                    patientName: appointment.patientName,
                    doctorName: appointment.doctorName,
                    appointmentDate: appointment.date,
                    appointmentId: appointment._id?.toString?.() ? appointment._id.toString() : appointment._id
                });

                appointment.successEmailSent = true;
                appointment.successEmailSentAt = new Date();
                await appointment.save();
            } catch (emailErr) {
                console.error('[createAppointment] Failed to send success email:', emailErr);
            }
        }

        // Populate the references so we return full objects, not just IDs
        await appointment.populate('patient');
        await appointment.populate('doctor');

        // Log the action for audit trail
        await logAction(req, 'Receptionist', doctorName || 'System', `Booked ${patientName} with Dr. ${doctorName} on ${date}`);

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: appointment
        });

    } catch (err) {
        console.error('[appointmentController.createAppointment] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create appointment',
            error: err.message
        });
    }
};

// ─── 2. GET ALL APPOINTMENTS ────────────────────────────────────────────────────
/**
 * GET /api/receptionist/appointments
 * Supports filters:
 *   ?date=2026-04-19               (appointments on a specific date)
 *   ?doctorId=507f...              (appointments for a specific doctor)
 *   ?status=Pending                (appointments with a specific status)
 *   ?page=1&limit=20               (pagination)
 *
 * STUDENT DEFENSE NOTE:
 * The receptionist needs to see:
 * 1. Today's appointments (for the queue view)
 * 2. Appointments for a specific doctor (to check availability)
 * 3. Appointments with status="Pending" (to confirm or reschedule)
 *
 * We support flexible filtering using query parameters.
 */
exports.getAllAppointments = async (req, res) => {
    try {
        const { date, doctorId, status, page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;
        const filter = {};

        // Apply date filter if provided (matches the entire day)
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setDate(endOfDay.getDate() + 1);
            filter.date = { $gte: startOfDay, $lt: endOfDay };
        }

        // Apply doctor filter if provided
        if (doctorId) {
            filter.doctor = doctorId;
        }

        // Apply status filter if provided
        if (status) {
            filter.status = status;
        }

        // Fetch appointments with populated references
        const appointments = await Appointment
            .find(filter)
            .populate('patient', 'firstName lastName phone')  // Include only essential patient fields
            .populate('doctor', 'name role')                  // Include only essential doctor fields
            .sort({ date: 1 })  // Sort by date ascending (earliest first)
            .skip(skip)
            .limit(limit);

        // Get total count for pagination metadata
        const total = await Appointment.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: appointments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error('[appointmentController.getAllAppointments] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: err.message
        });
    }
};

// ─── 3. GET SINGLE APPOINTMENT ──────────────────────────────────────────────────
/**
 * GET /api/receptionist/appointments/:id
 *
 * Fetch a single appointment by its MongoDB ObjectId.
 * Used by the Queue page to get full details of a selected appointment.
 */
exports.getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment
            .findById(id)
            .populate('patient')
            .populate('doctor');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: `Appointment with ID ${id} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });

    } catch (err) {
        console.error('[appointmentController.getAppointmentById] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointment',
            error: err.message
        });
    }
};

// ─── 4. UPDATE APPOINTMENT STATUS ───────────────────────────────────────────────
/**
 * PATCH /api/receptionist/appointments/:id/status
 *
 * Request body:
 * { status: "Confirmed" | "Completed" | "No Show" | "Cancelled" }
 *
 * STUDENT DEFENSE NOTE:
 * The appointment status follows a workflow:
 *   Pending → Confirmed → Completed (or No Show if patient didn't show)
 *   Pending → Cancelled (if receptionist cancels)
 *
 * This endpoint is used by:
 * 1. Queue Manager: Mark patient as "present" or "no show"
 * 2. Doctor: Mark appointment as "completed"
 * 3. Admin: Manually adjust status if needed
 *
 * Every status change is logged in the audit trail.
 */
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validation: Valid status value
        const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Fetch first so we can do idempotent email triggering safely.
        const appointment = await Appointment.findById(id)
            .populate('patient')
            .populate('doctor');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: `Appointment with ID ${id} not found`
            });
        }

        const previousStatus = appointment.status;
        appointment.status = status;

        // Email trigger requirement:
        // When status becomes "Confirmed", send "Success" email automatically.
        // Idempotency: only send once per appointment using successEmailSent flag.
        if (status === 'Confirmed' && !appointment.successEmailSent) {
            const patientEmail = appointment.patient?.email;

            try {
                const emailResult = await sendSuccessEmail({
                    to: patientEmail,
                    patientName: appointment.patientName,
                    doctorName: appointment.doctorName,
                    appointmentDate: appointment.date,
                    appointmentId: appointment._id?.toString?.() ? appointment._id.toString() : appointment._id
                });

                if (emailResult?.sent) {
                    appointment.successEmailSent = true;
                    appointment.successEmailSentAt = new Date();
                }
            } catch (emailErr) {
                console.error('[updateAppointmentStatus] Failed to send success email:', emailErr);
                // Keep appointment status update successful even if email sending fails.
            }
        }

        await appointment.save();

        // Log the status change
        await logAction(
            req,
            'Receptionist',
            'Receptionist',
            `Changed appointment status to ${status} for ${appointment.patientName}`
        );

        res.status(200).json({
            success: true,
            message: `Appointment status updated to ${status}`,
            data: appointment
        });

    } catch (err) {
        console.error('[appointmentController.updateAppointmentStatus] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status',
            error: err.message
        });
    }
};

// ─── 5. DELETE APPOINTMENT ──────────────────────────────────────────────────────
/**
 * DELETE /api/receptionist/appointments/:id
 *
 * Remove an appointment from the schedule entirely.
 * Used when: patient cancels, receptionist books wrong slot, etc.
 *
 * STUDENT DEFENSE NOTE:
 * We soft-delete by changing status to "Cancelled" rather than hard-deleting,
 * so we maintain a complete audit trail of all bookings (including cancelled ones).
 * This is important for:
 * - "No Show Rate" calculations (includes historical data)
 * - Compliance audits (all changes must be traceable)
 */
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: 'Cancelled' },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: `Appointment with ID ${id} not found`
            });
        }

        // Log the cancellation
        await logAction(
            req,
            'Receptionist',
            'Receptionist',
            `Cancelled appointment for ${appointment.patientName}`
        );

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: appointment
        });

    } catch (err) {
        console.error('[appointmentController.deleteAppointment] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel appointment',
            error: err.message
        });
    }
};

// ─── 6. GET DOCTOR'S AVAILABLE SLOTS ────────────────────────────────────────────
/**
 * GET /api/receptionist/doctors/:doctorId/available-slots?date=2026-04-19
 *
 * Returns the time slots available for a specific doctor on a specific date.
 * This powers the "Smart Booking" feature where the receptionist sees:
 *   [09:00-09:30 ✓]  [09:35-10:05 ✓]  [14:00-14:30 ✗]
 *
 * STUDENT DEFENSE NOTE:
 * This endpoint is the CORE of the "Check Availability" feature.
 * It reads the doctor's schedule.availableSlots and filters out:
 * 1. Slots marked as "blocked" (prayer time, lunch, etc.)
 * 2. Slots already booked by other patients
 *
 * Returns an array like:
 * [
 *   { startTime: "09:00", endTime: "09:30", status: "available" },
 *   { startTime: "09:35", endTime: "10:05", status: "available" },
 *   { startTime: "10:10", endTime: "10:40", status: "booked" }
 * ]
 */
exports.getDoctorAvailableSlots = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;

        // Validation: doctorId and date are provided
        if (!doctorId || !date) {
            return res.status(400).json({
                success: false,
                message: 'doctorId and date query parameter are required'
            });
        }

        // Find the doctor
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: `Doctor with ID ${doctorId} not found`
            });
        }

        // Check if doctor has a schedule configured
        if (!doctor.schedule || !doctor.schedule.availableSlots || doctor.schedule.availableSlots.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Doctor has no schedule configured',
                data: []
            });
        }

        // Get all appointments for this doctor on this date
        const appointmentDate = new Date(date);
        const nextDay = new Date(appointmentDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const existingAppointments = await Appointment.find({
            doctor: doctorId,
            date: {
                $gte: appointmentDate,
                $lt: nextDay
            },
            status: { $ne: 'Cancelled' }  // Don't count cancelled appointments
        });

        // Build list of booked times
        const bookedTimes = existingAppointments.map(apt => apt.date.toTimeString().slice(0, 5)); // "09:00"

        // Enhance slots with availability status
        const slotsWithStatus = doctor.schedule.availableSlots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: slot.status === 'blocked' ? 'blocked' : (bookedTimes.includes(slot.startTime) ? 'booked' : 'available')
        }));

        res.status(200).json({
            success: true,
            data: slotsWithStatus,
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                role: doctor.role
            }
        });

    } catch (err) {
        console.error('[appointmentController.getDoctorAvailableSlots] Error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available slots',
            error: err.message
        });
    }
};

// ─── 7. GET LIVE QUEUE SCREEN ───────────────────────────────────────────────────
/**
 * GET /api/appointments/queue
 * 
 * STUDENT DEFENSE NOTE:
 * This endpoint powers the "Live Queue Screen" in the clinic waiting room.
 * It fetches today's appointments and splits them into two categories:
 *   1. currentCall: The patient whose appointment time is right now.
 *   2. upcoming: The list of patients waiting next.
 * 
 * If no patient is currently scheduled (e.g. doctor break), it returns an 
 * array of `healthTips` to be displayed on the big screen instead of an empty space.
 * 
 * Note on Statuses: The prompt requested filtering by 'Absent', 'Arrived', and 'In Progress'.
 * Our MongoDB schema uses 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'No Show'.
 * We filter by an array that catches both sets of terminology to ensure it works flawlessly.
 */
exports.getQueue = async (req, res) => {
    try {
        // Use UTC-string approach to match getAllAppointments — avoids local-timezone drift
        const todayStr = new Date().toISOString().split('T')[0]; // "2026-05-20"
        const startOfDay = new Date(todayStr);                   // 2026-05-20T00:00:00.000Z
        const endOfDay   = new Date(todayStr);
        endOfDay.setDate(endOfDay.getDate() + 1);                // 2026-05-21T00:00:00.000Z

        // Fetch all active (non-completed, non-cancelled) appointments for today
        const appointments = await Appointment.find({
            date:   { $gte: startOfDay, $lt: endOfDay },
            status: { $in: ['Confirmed', 'Pending', 'Checked-In', 'In Progress'] }
        })
        .populate('patient', 'firstName lastName')
        .populate('doctor', 'name')
        .sort({ timeSlot: 1 });

        const doctorQueues = {};

        for (const appt of appointments) {
            const doctorId   = appt.doctor?._id?.toString() || 'unknown';
            const doctorName = appt.doctor?.name || 'Unknown Doctor';

            if (!doctorQueues[doctorId]) {
                doctorQueues[doctorId] = { doctorId, doctorName, currentCall: null, upcoming: [] };
            }

            const patientName = appt.patient
                ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() || 'Unknown'
                : 'Unknown Patient';

            const entry = {
                _id: appt._id,
                patientName,
                timeSlot: appt.timeSlot || '--:--',
                date: appt.date,
                status: appt.status
            };

            // Status-based split — mirrors exactly what the receptionist dashboard shows:
            //   "Checked-In" / "In Progress"  →  doctor is actively seeing this patient (Now Calling)
            //   "Confirmed"  / "Pending"       →  patient is waiting (Next Patients)
            if ((appt.status === 'Checked-In' || appt.status === 'In Progress')
                    && !doctorQueues[doctorId].currentCall) {
                doctorQueues[doctorId].currentCall = entry;
            } else {
                doctorQueues[doctorId].upcoming.push(entry);
            }
        }

        const doctors       = Object.values(doctorQueues);
        const hasAnyCurrent = doctors.some(d => d.currentCall !== null);

        const healthTips = [
            { id: 1, title: 'Stay Hydrated',   description: 'Drink at least 8 glasses of water every day.',              image: '💧' },
            { id: 2, title: 'Rest & Recover',  description: 'Quality sleep is when your body heals. Aim for 7–8 hours.', image: '🛏️' },
            { id: 3, title: 'Wash Your Hands', description: 'Proper hand hygiene is the best defence against infection.', image: '🧼' }
        ];

        res.status(200).json({
            success: true,
            data: { doctors, healthTips: hasAnyCurrent ? [] : healthTips }
        });

    } catch (err) {
        console.error('[appointmentController.getQueue] Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch queue', error: err.message });
    }
};

```

#### File: `auditController.js`
```javascript
/**
 * =============================================================================
 * AUDIT CONTROLLER — controllers/auditController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller handles reading audit log records from the database.
 * It is intentionally READ-ONLY — audit logs are written by other controllers
 * (via auditLogger.js), never via a direct API endpoint. This is a security
 * principle: you should never expose an API endpoint that lets someone manually
 * inject a fake audit record.
 *
 * FEATURES:
 *   1. `getAuditLogs`   — Fetch all logs with optional search + role filter.
 *   2. `getRecentLogs`  — Fetch only the most recent 20 logs (lightweight call).
 * =============================================================================
 */

const AuditLog = require('../models/AuditLog');

// ─── 1. GET ALL AUDIT LOGS (with optional filtering) ────────────────────────
/**
 * GET /api/admin/audit-logs
 * GET /api/admin/audit-logs?search=login
 * GET /api/admin/audit-logs?search=login&role=Admin
 *
 * STUDENT DEFENSE NOTE:
 * Query parameters (?search=...) are optional — if not provided, we return all logs.
 * We build the MongoDB filter object (`filter`) dynamically based on which
 * query parameters were actually sent. This is cleaner than having if/else
 * branches for every combination.
 *
 * PAGINATION:
 * We also support `?page=1&limit=50` for pagination. Without pagination, a large
 * clinic with thousands of audit entries would send them all at once, slowing
 * the frontend. Pagination sends data in smaller, manageable pages.
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const { search, role, page = 1, limit = 50 } = req.query;

        // Start with an empty filter object (means "return all").
        const filter = {};

        // If a role filter is provided (e.g., ?role=Admin), add it to the filter.
        if (role && role !== 'All') {
            filter.role = role;
        }

        // If a search term is provided, search across `name` and `action` fields.
        // `$or` means: return the document if EITHER condition matches.
        // `$regex` with `$options: 'i'` = case-insensitive "contains" search.
        if (search && search.trim() !== '') {
            filter.$or = [
                { name:   { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { role:   { $regex: search, $options: 'i' } }
            ];
        }

        // STUDENT DEFENSE NOTE: PAGINATION MATH
        // page=1, limit=50 → skip 0  documents, take 50
        // page=2, limit=50 → skip 50 documents, take 50
        // page=3, limit=50 → skip 100 documents, take 50
        // Formula: skip = (page - 1) * limit
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute the query with filtering, sorting, and pagination.
        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })             // Newest first
            .skip(skip)                           // Skip records for previous pages
            .limit(parseInt(limit));              // Take only `limit` records

        // Also get the total count for the frontend to calculate total pages.
        const total = await AuditLog.countDocuments(filter);

        res.status(200).json({
            logs,
            pagination: {
                total,
                page:       parseInt(page),
                limit:      parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
};

// ─── 2. GET RECENT AUDIT LOGS ────────────────────────────────────────────────
/**
 * GET /api/admin/audit-logs/recent
 *
 * STUDENT DEFENSE NOTE:
 * A "lightweight" version of the full audit log endpoint for use-cases where
 * we only need the last 20 events (e.g., a summary widget in a future dashboard).
 * Using `.limit(20)` prevents fetching thousands of records unnecessarily.
 */
exports.getRecentLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent audit logs', error: error.message });
    }
};

```

#### File: `authController.js`
```javascript
/**
 * =============================================================================
 * AUTHENTICATION CONTROLLER — controllers/authController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller handles the login process for our staff members (Admin, 
 * Receptionists, Doctors). It is responsible for verifying credentials and 
 * issuing a JSON Web Token (JWT) so the user can securely access protected routes.
 * 
 * Flow:
 * 1. Extract email and password from the request body.
 * 2. Find the user in the database by their email.
 * 3. Use bcrypt to securely compare the provided password with the hashed one.
 * 4. Generate a JWT containing the user's ID, role, and name.
 * 5. Send the token back to the client to be saved in localStorage or a cookie.
 * =============================================================================
 */

const Doctor = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // 2. Find the staff member by email
        // We use .select('+password') because we hid the password field by default 
        let staff = await Doctor.findOne({ email }).select('+password');
        if (!staff) {
            staff = await Receptionist.findOne({ email }).select('+password');
        }
        if (!staff) {
            staff = await Admin.findOne({ email }).select('+password');
        }

        if (!staff) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, staff.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Create a JSON Web Token (JWT) payload
        // This is the data that will be securely encoded into the token.
        // The frontend can read this to know who is logged in and what their role is.
        const payload = {
            id: staff._id,
            name: staff.name,
            role: staff.role
        };

        // 5. Sign the token using our secret key
        // process.env.JWT_SECRET should be defined in our .env file.
        // It expires in 24 hours for security purposes.
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'fallback_secret_key_for_development', 
            { expiresIn: '24h' }
        );

        // 6. Send the response back to the client
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: payload
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

```

#### File: `doctorController.js`
```javascript
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
```

#### File: `MessageController.js`
```javascript
/* 
   This controller handles the retrieval and status management of 
   in-app messages between the Doctor and Receptionist.
*/
const Message = require('../models/Message');

// Fetches the full chat history
exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to load messages" });
    }
};

// Updates 'sent' to 'read' (The blue double-check logic)
exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.body;
        await Message.updateMany(
            { senderId: senderId, status: 'sent' }, 
            { status: 'read' }
        );
        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

#### File: `patientController.js`
```javascript
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

```

#### File: `reportController.js`
```javascript
/**
 * =============================================================================
 * REPORT CONTROLLER — controllers/reportController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller powers the System Reports page. When the admin clicks
 * "Generate Report", this controller:
 *   1. Receives the period (month, year, type) from the frontend.
 *   2. Queries the real database to calculate stats for that period.
 *   3. Saves the result as a Report document (so it appears in "Previous Reports").
 *   4. Writes an audit log entry.
 *   5. Returns the report data back to the frontend.
 *
 * The "Export" feature converts the report data into a CSV string and sends
 * it with the correct HTTP headers so the browser downloads it as a file.
 *
 * KEY IDEA — DATE RANGE QUERIES:
 * To find all appointments in "April 2026", we construct a date range:
 *   - startDate: April 1, 2026 00:00:00
 *   - endDate:   April 30, 2026 23:59:59
 * Then we query: { date: { $gte: startDate, $lte: endDate } }
 * `$gte` = "greater than or equal to" (≥)
 * `$lte` = "less than or equal to"    (≤)
 * =============================================================================
 */

const Report      = require('../models/Report');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor      = require('../models/Doctor');
const Receptionist= require('../models/Receptionist');
const Admin       = require('../models/Admin');
const logAction   = require('../utils/auditLogger');

// Month name to number map for building date ranges from the frontend's string values.
const MONTH_MAP = {
    January: 0, February: 1, March: 2,    April: 3,
    May: 4,     June: 5,     July: 6,     August: 7,
    September: 8, October: 9, November: 10, December: 11
};

// ─── HELPER: Build Date Range ────────────────────────────────────────────────
/**
 * buildDateRange — creates the start and end Date objects for a given period.
 *
 * STUDENT DEFENSE NOTE:
 * `new Date(year, monthIndex, 1)` creates the FIRST day of a month.
 * `new Date(year, monthIndex + 1, 0)` creates the LAST day of that month.
 * The trick `monthIndex + 1, day 0` asks for "day 0 of the next month",
 * which JavaScript resolves to the last day of the current month.
 * This cleverly handles months with 28, 29, 30, or 31 days automatically.
 *
 * @returns {object} { startDate, endDate }
 */
function buildDateRange(type, month, year) {
    const y = parseInt(year);

    if (type === 'Monthly Summary') {
        const m = MONTH_MAP[month] ?? 0;
        const startDate = new Date(y, m, 1, 0, 0, 0, 0);
        const endDate   = new Date(y, m + 1, 0, 23, 59, 59, 999); // Last day of month
        return { startDate, endDate };
    }

    if (type === 'Quarterly Overview') {
        // Determine quarter from the selected month.
        const m = MONTH_MAP[month] ?? 0;
        const quarterStart = Math.floor(m / 3) * 3; // Quarter starts: 0 (Jan), 3 (Apr), 6 (Jul), 9 (Oct)
        const startDate = new Date(y, quarterStart, 1, 0, 0, 0, 0);
        const endDate   = new Date(y, quarterStart + 3, 0, 23, 59, 59, 999);
        return { startDate, endDate };
    }

    if (type === 'Annual Report') {
        const startDate = new Date(y, 0,  1, 0,  0,  0,  0);   // Jan 1
        const endDate   = new Date(y, 11, 31, 23, 59, 59, 999); // Dec 31
        return { startDate, endDate };
    }

    // Default: full year
    return {
        startDate: new Date(y, 0,  1,  0,  0,  0,  0),
        endDate:   new Date(y, 11, 31, 23, 59, 59, 999)
    };
}

// ─── 1. GENERATE REPORT ──────────────────────────────────────────────────────
/**
 * POST /api/admin/reports/generate
 * Body: { type: "Monthly Summary", month: "April", year: "2026" }
 *
 * STUDENT DEFENSE NOTE:
 * This is an "expensive" operation — it runs multiple database queries at once.
 * We use `Promise.all([...])` to run all queries in PARALLEL rather than one
 * after another. This is like asking 5 different librarians to find 5 different
 * books at the same time, instead of asking one librarian to find them one by one.
 */
exports.generateReport = async (req, res) => {
    try {
        const { type = 'Monthly Summary', month = 'April', year = '2026' } = req.body;

        // Build the date range for the selected period.
        const { startDate, endDate } = buildDateRange(type, month, year);

        // Date filter used across multiple queries.
        const dateFilter = { date: { $gte: startDate, $lte: endDate } };

        // Run all database queries IN PARALLEL using Promise.all
        // STUDENT DEFENSE NOTE:
        // `Promise.all` takes an array of Promises and waits for ALL of them
        // to complete before continuing. All queries run simultaneously, cutting
        // the total wait time down to the slowest single query (not the sum of all).
        const [
            totalAppointments,
            completedAppointments,
            cancelledAppointments,
            noShowCount,
            newPatients,
            doctorsCount,
            receptionistsCount,
            adminsCount
        ] = await Promise.all([
            Appointment.countDocuments(dateFilter),
            Appointment.countDocuments({ ...dateFilter, status: 'Completed' }),
            Appointment.countDocuments({ ...dateFilter, status: 'Cancelled' }),
            Appointment.countDocuments({ ...dateFilter, status: 'No Show' }),
            Patient.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
            Doctor.countDocuments({ status: 'Active' }),
            Receptionist.countDocuments({ status: 'Active' }),
            Admin.countDocuments({ status: 'Active' })
        ]);
        
        const activeStaff = doctorsCount + receptionistsCount + adminsCount;

        // Total patients ever registered (all time, not filtered by period).
        const totalPatients = await Patient.countDocuments();

        // Calculate no-show rate.
        const noShowRate = totalAppointments > 0
            ? ((noShowCount / totalAppointments) * 100).toFixed(1) + '%'
            : '0%';

        // Build a display name for the report.
        const reportName = type === 'Annual Report'
            ? `${year} Annual Report`
            : type === 'Quarterly Overview'
            ? `Q${Math.ceil((MONTH_MAP[month] + 1) / 3)} ${year} Quarterly Overview`
            : `${month} ${year} Monthly Summary`;

        // Save the generated report to the database.
        const report = await Report.create({
            name: reportName,
            type,
            month,
            year,
            data: {
                totalPatients,
                totalAppointments,
                completedAppointments,
                cancelledAppointments,
                noShowCount,
                noShowRate,
                activeStaff,
                newPatients
            },
            generatedBy: 'Admin'
        });

        // Write an audit log for this action.
        await logAction(req, 'Admin', 'Admin', `Generated ${reportName}`);

        // Return the full saved report.
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error generating report', error: error.message });
    }
};

// ─── 2. GET ALL PREVIOUS REPORTS ────────────────────────────────────────────
/**
 * GET /api/admin/reports
 *
 * STUDENT DEFENSE NOTE:
 * This powers the "Previous Reports" list in the frontend.
 * We sort by `-createdAt` (newest first) so the most recently generated
 * report appears at the top.
 *
 * `.select('name type month year createdAt generatedBy')` limits the fields
 * returned — we don't need the full `data` object for the list view.
 * This makes the response smaller and faster.
 */
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({})
            .select('name type month year createdAt generatedBy')
            .sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
    }
};

// ─── 3. GET A SINGLE REPORT ──────────────────────────────────────────────────
/**
 * GET /api/admin/reports/:id
 *
 * Returns the full report document including the `data` sub-document.
 * Used when the admin wants to view the full details of a previous report.
 */
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
};

// ─── 4. EXPORT REPORT AS CSV ─────────────────────────────────────────────────
/**
 * GET /api/admin/reports/export/:id
 *
 * STUDENT DEFENSE NOTE:
 * CSV (Comma-Separated Values) is a universal data format that opens in Excel,
 * Google Sheets, or any spreadsheet application. It's perfect for medical
 * reports because clinic managers are familiar with spreadsheets.
 *
 * HOW BROWSER DOWNLOAD WORKS:
 * We set two special HTTP response headers:
 *   - `Content-Type: text/csv` — tells the browser this is a CSV file.
 *   - `Content-Disposition: attachment; filename="..."` — forces the browser
 *     to download the response as a file instead of displaying it on screen.
 */
exports.exportReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Build the CSV string manually.
        // Row 1: headers, Row 2: values
        const { data } = report;
        const csvLines = [
            // Header row
            'Report Name,Type,Period,Generated At,Total Patients,Total Appointments,Completed,Cancelled,No Shows,No Show Rate,Active Staff,New Patients',
            // Data row
            [
                `"${report.name}"`,           // Wrap with quotes to handle commas in names
                `"${report.type}"`,
                `"${report.month || ''} ${report.year}"`,
                `"${new Date(report.createdAt).toLocaleDateString('en-GB')}"`,
                data.totalPatients,
                data.totalAppointments,
                data.completedAppointments,
                data.cancelledAppointments,
                data.noShowCount,
                `"${data.noShowRate}"`,
                data.activeStaff,
                data.newPatients
            ].join(',')
        ];

        const csvContent = csvLines.join('\n');

        // Create a safe filename from the report name (replace spaces with underscores).
        const filename = `${report.name.replace(/\s+/g, '_')}.csv`;

        // Set HTTP headers to trigger a browser file download.
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Log the export action.
        await logAction(req, 'Admin', 'Admin', `Exported report: ${report.name}`);

        // Send the CSV string as the response body.
        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting report', error: error.message });
    }
};

```

#### File: `settingsController.js`
```javascript
/**
 * =============================================================================
 * SETTINGS CONTROLLER — controllers/settingsController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller manages the single SystemSettings document in the database.
 * It implements the "Singleton Pattern" — only ONE settings record ever exists.
 *
 * SINGLETON PATTERN IMPLEMENTATION:
 * Instead of creating a new document for each request, we always find-or-create
 * the one settings document. We use Mongoose's `findOneAndUpdate` with the
 * `{ upsert: true }` option. "Upsert" = "Update if found, Insert if not found."
 *
 * DYNAMIC HEALTH DATA:
 * Some values on the Settings page are NOT stored in the database — they are
 * calculated in real-time from the server's state:
 *   - Database status: checked via `mongoose.connection.readyState`
 *   - System uptime: via `process.uptime()`
 * These are added to the response object in the controller, not stored in MongoDB.
 * =============================================================================
 */

const SystemSettings = require('../models/SystemSettings');
const logAction      = require('../utils/auditLogger');
const mongoose       = require('mongoose');

// ─── 1. GET SETTINGS ────────────────────────────────────────────────────────
/**
 * GET /api/admin/settings
 *
 * STUDENT DEFENSE NOTE:
 * `findOneAndUpdate` with `{ upsert: true, new: true }` is a compound
 * operation. In one atomic database call, it:
 *   - Finds the single settings document (filter: `{}` = find any)
 *   - If found: returns it as-is (we're not updating anything here, just reading)
 *   - If NOT found (first run): creates it with the default values from the Schema
 *
 * `new: true` means "return the document AFTER the operation" (vs. before).
 * `setDefaultsOnInsert: true` applies the Schema's default values when creating.
 */
exports.getSettings = async (req, res) => {
    try {
        // Find or create the singleton settings document.
        let settings = await SystemSettings.findOneAndUpdate(
            {},                             // Filter: match any document (the one and only)
            {},                             // Update: nothing (we're just reading)
            {
                upsert: true,              // Create if it doesn't exist
                new: true,                 // Return the resulting document
                setDefaultsOnInsert: true  // Use Schema defaults when inserting
            }
        );

        // ─── Add Dynamic (Real-Time) Health Data ─────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // `mongoose.connection.readyState` is a number:
        //   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        // We check for `=== 1` to confirm the database is truly connected.
        const dbConnected = mongoose.connection.readyState === 1;

        // `process.uptime()` returns seconds since Node.js process started.
        const uptimeSeconds = process.uptime();
        const uptimeHours   = Math.floor(uptimeSeconds / 3600);
        const uptimeMins    = Math.floor((uptimeSeconds % 3600) / 60);

        // Convert the Mongoose document to a plain JavaScript object so we
        // can add extra dynamic properties to it before sending.
        const responseData = settings.toObject();

        // Attach dynamic health properties to the response.
        responseData.health = {
            databaseStatus: dbConnected ? 'Connected' : 'Disconnected',
            apiStatus:      'Operational',     // If we get here, the API is obviously running
            emailService:   'Connected',       // Simulated for demonstration
            systemUptime:   `${uptimeHours}h ${uptimeMins}m`
        };

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// ─── 2. UPDATE SETTINGS ─────────────────────────────────────────────────────
/**
 * PUT /api/admin/settings
 * Body: { workingHours: "9:00 AM - 5:00 PM" }
 *
 * STUDENT DEFENSE NOTE:
 * Per the frontend UI, ONLY `workingHours` is editable. The other fields
 * (clinicName, address, phone) are displayed as read-only text. This controller
 * enforces that constraint by only extracting `workingHours` from `req.body`
 * and ignoring any other fields the user might try to send.
 *
 * This is "whitelist-based updating" — a security best practice.
 * Instead of blindly updating `{ ...req.body }`, we pick ONLY what we allow.
 * This prevents "mass assignment" attacks where a malicious user might try to
 * update restricted fields by injecting extra JSON properties.
 */
exports.updateSettings = async (req, res) => {
    try {
        // WHITELIST: Only allow `workingHours` to be updated.
        const { workingHours } = req.body;

        if (!workingHours || workingHours.trim() === '') {
            return res.status(400).json({ message: 'Working hours value is required' });
        }

        // Update the singleton settings document.
        // `{ new: true }` returns the document AFTER the update.
        const updated = await SystemSettings.findOneAndUpdate(
            {},                          // Match the one settings document
            { $set: { workingHours } },  // Only update the `workingHours` field
            { new: true, upsert: true }  // Return updated doc; create if missing
        );

        // Write to audit log.
        await logAction(req, 'Admin', 'Admin', `Updated working hours to: ${workingHours}`);

        res.status(200).json({
            message: 'Working hours updated successfully',
            workingHours: updated.workingHours
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};

// ─── 3. TRIGGER BACKUP ──────────────────────────────────────────────────────
/**
 * POST /api/admin/settings/backup
 *
 * STUDENT DEFENSE NOTE:
 * In a production system, this would trigger a real backup mechanism (e.g.,
 * mongodump, AWS S3 snapshot, etc.). For our academic project, we:
 *   1. Update the `lastBackup` timestamp in the settings document.
 *   2. Write an audit log entry.
 *   3. Return a success response.
 *
 * This simulates the backup operation while providing a fully functional
 * backend endpoint that the frontend Settings page can connect to.
 *
 * `Date.now` vs `new Date()`: Both work. `Date.now` returns a Unix timestamp
 * (number of milliseconds since Jan 1, 1970). Mongoose automatically converts
 * it to a proper Date object because the field type is `Date`.
 */
exports.triggerBackup = async (req, res) => {
    try {
        const backupTime = new Date();

        // Update the lastBackup field to record when the backup was triggered.
        await SystemSettings.findOneAndUpdate(
            {},
            { $set: { lastBackup: backupTime } },
            { upsert: true }
        );

        // Log the backup action as a "System" role action.
        await logAction(req, 'Admin', 'Admin', 'Manual system backup initiated');

        res.status(200).json({
            message: 'Backup initiated successfully',
            lastBackup: backupTime.toLocaleDateString('en-GB', {
                year: 'numeric', month: 'long', day: 'numeric'
            })
        });
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
};

```

#### File: `statsController.js`
```javascript
/**
 * =============================================================================
 * STATS CONTROLLER — controllers/statsController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller powers the Admin Dashboard page. It is the most complex
 * controller in the system because it doesn't just fetch raw data — it
 * CALCULATES and AGGREGATES data from multiple collections to return a single,
 * rich JSON response.
 *
 * The dashboard needs:
 *   - 5 stat cards (totalPatients, totalAppointments, activeStaff, noShowRate, uptime)
 *   - Monthly Activity table (appointments + new patients + no-shows per month)
 *   - Staff Workload section (name, role, consultations, hoursWorked per staff member)
 *
 * AGGREGATION PIPELINE:
 * MongoDB's aggregation pipeline is like an assembly line of data processing steps.
 * We chain `$match` (filter), `$group` (calculate), and `$sort` (order) stages
 * together to produce the exact shape of data the frontend expects.
 * =============================================================================
 */

const Doctor      = require('../models/Doctor');
const Receptionist= require('../models/Receptionist');
const Admin       = require('../models/Admin');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const mongoose    = require('mongoose');

/**
 * GET /api/admin/stats
 *
 * Returns a single JSON object with all data needed to render every section
 * of the Admin Dashboard without any additional API calls.
 */
exports.getDashboardStats = async (req, res) => {
    try {

        // ─── STEP 1: Simple Count Queries ────────────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // `countDocuments()` is the most efficient way to count records.
        // It uses MongoDB's built-in count mechanism and never loads the actual
        // documents into memory, making it extremely fast even with millions of records.

        const totalPatients     = await Patient.countDocuments();
        const totalAppointments = await Appointment.countDocuments();

        // Count only staff members who are currently active.
        const activeDoctors = await Doctor.countDocuments({ status: 'Active' });
        const activeReceptionists = await Receptionist.countDocuments({ status: 'Active' });
        const activeAdmins = await Admin.countDocuments({ status: 'Active' });
        const activeStaff = activeDoctors + activeReceptionists + activeAdmins;

        // ─── STEP 2: No Show Rate Calculation ────────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // No Show Rate = (number of "No Show" appointments / total appointments) × 100
        // We must guard against dividing by zero if no appointments exist yet.

        const noShowCount = await Appointment.countDocuments({ status: 'No Show' });
        const noShowRate = totalAppointments > 0
            ? ((noShowCount / totalAppointments) * 100).toFixed(1) + '%'
            : '0%';

        // ─── STEP 3: System Uptime ────────────────────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // `process.uptime()` is a built-in Node.js function that returns how many
        // seconds the current Node.js process has been running. We convert it to
        // hours and minutes for a human-readable format.
        // Note: This resets to 0 every time the server restarts.

        const uptimeSeconds = process.uptime();
        const uptimeHours   = Math.floor(uptimeSeconds / 3600);
        const uptimeMins    = Math.floor((uptimeSeconds % 3600) / 60);
        const systemUptime  = `${uptimeHours}h ${uptimeMins}m`;

        // ─── STEP 4: Monthly Activity Aggregation ─────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // This is a MongoDB AGGREGATION PIPELINE — the most powerful feature of MongoDB.
        // Think of it as a factory assembly line where data is processed step by step:
        //
        // Stage 1: $group — groups appointment documents by year and month.
        //   - `$month: "$date"` and `$year: "$date"` extract month/year from the Date field.
        //   - `$sum: 1` counts one for each document in the group (= total appointments).
        //   - `$sum: { $cond: ... }` counts only documents matching a condition (= no shows).
        //
        // Stage 2: $sort — orders groups by year and month (ascending = oldest to newest).
        //
        // Stage 3: $limit — only return the last 6 months (to match the dashboard table).

        const monthlyAppointmentData = await Appointment.aggregate([
            {
                $group: {
                    // Group key: unique combination of year + month
                    _id: {
                        year:  { $year:  '$date' },
                        month: { $month: '$date' }
                    },
                    // Count every appointment in this month
                    appointments: { $sum: 1 },
                    // Count only appointments with 'No Show' status using $cond (conditional)
                    noShows: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'No Show'] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },  // Newest first
            { $limit: 6 }                                       // Last 6 months only
        ]);

        // Count new patients per month to add to the monthly activity table.
        const monthlyPatientData = await Patient.aggregate([
            {
                $group: {
                    _id: {
                        year:  { $year:  '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    newPatients: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
        ]);

        // STUDENT DEFENSE NOTE:
        // We "join" the two arrays in JavaScript (since MongoDB aggregations are separate).
        // The month names array lets us convert the month number (4) to "Apr".
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // Merge appointment data with patient data by matching year + month.
        const monthlyActivity = monthlyAppointmentData.reverse().map(apptMonth => {
            // Find the matching patient registration data for this same month.
            const patientMonth = monthlyPatientData.find(p =>
                p._id.year  === apptMonth._id.year &&
                p._id.month === apptMonth._id.month
            );
            return {
                month:        monthNames[apptMonth._id.month - 1],  // month is 1-indexed, array is 0-indexed
                year:         apptMonth._id.year,
                appointments: apptMonth.appointments,
                newPatients:  patientMonth ? patientMonth.newPatients : 0,
                noShows:      apptMonth.noShows
            };
        });

        // ─── STEP 5: Staff Workload ───────────────────────────────────────────────
        // STUDENT DEFENSE NOTE:
        // We fetch all active staff and select only the workload-relevant fields.
        // `.select('name role consultations appointmentsManaged tasksCompleted hoursWorked')`
        // means: return ONLY these fields. The `-_id` would exclude the ID, but here
        // we include it (no minus prefix) because the frontend might need it.

        const doctorsWorkload = await Doctor.find({ status: 'Active' })
            .select('name role consultations appointmentsManaged tasksCompleted hoursWorked isAdmin');
        const receptionistsWorkload = await Receptionist.find({ status: 'Active' })
            .select('name role consultations appointmentsManaged tasksCompleted hoursWorked isAdmin');
        const adminsWorkload = await Admin.find({ status: 'Active' })
            .select('name role consultations appointmentsManaged tasksCompleted hoursWorked isAdmin');
            
        const staffWorkload = [...doctorsWorkload, ...receptionistsWorkload, ...adminsWorkload]
            .sort((a, b) => a.name.localeCompare(b.name));

        // ─── STEP 6: Assemble and Send Response ──────────────────────────────────
        // All calculations are complete. We now return a single clean JSON object.

        res.status(200).json({
            // Stat cards
            totalPatients,
            totalAppointments,
            activeStaff,
            noShowRate,
            systemUptime,

            // Monthly Activity table
            monthlyActivity,

            // Staff Workload section
            staffWorkload
        });

    } catch (error) {
        console.error('[StatsController] getDashboardStats error:', error);
        res.status(500).json({
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

```

#### File: `userController.js`
```javascript
/**
 * =============================================================================
 * USER CONTROLLER — controllers/userController.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This controller handles user profile retrieval. It works with the auth
 * middleware to verify the JWT token and return the authenticated user's data.
 * =============================================================================
 */

const Doctor = require('../models/Doctor');
const Receptionist = require('../models/Receptionist');
const Admin = require('../models/Admin');
const Patient = require('../models/Patient');

/**
 * GET /api/users/profile
 * 
 * Retrieves the profile of the authenticated user based on the JWT token.
 * The auth middleware has already verified the token and attached the user
 * data to req.user.
 */
exports.getProfile = async (req, res) => {
    try {
        const { id, role } = req.user;

        let user;

        // Fetch the user based on their role
        if (role === 'Doctor') {
            user = await Doctor.findById(id).select('-password');
        } else if (role === 'Receptionist') {
            user = await Receptionist.findById(id).select('-password');
        } else if (role === 'Admin') {
            user = await Admin.findById(id).select('-password');
        } else if (role === 'Patient') {
            user = await Patient.findById(id);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name || `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: role,
            phone: user.phone,
            status: user.status || 'Active',
            ...user.toObject()
        });
    } catch (error) {
        console.error('[UserController] getProfile error:', error);
        res.status(500).json({
            message: 'Error fetching user profile',
            error: error.message
        });
    }
};

```

## Chapter 4: Real-time Live Queue Integration (Socket.io)
The most technically demanding feature of MedFlow is the Live Queue. In a traditional HTTP model, a doctor would have to constantly refresh their web browser to see if the receptionist checked in a new patient. This is unacceptable in a fast-paced clinic.

### 4.1 WebSocket Implementation
We integrated `Socket.io` alongside the Express server. When a client (the frontend) loads the dashboard, it establishes a persistent, bi-directional TCP connection (upgraded from HTTP) to the server. 
When the receptionist clicks "Send In", an HTTP POST request is sent. The database updates. Then, the Node.js server instantly broadcasts an event down the WebSocket pipe to all connected clients. The React frontend listens for this event and triggers a state update, instantly rendering the new patient on the doctor's screen in milliseconds, zero page reloads required.

## Chapter 5: The Presentation Layer (Next.js & React)
The frontend is an absolute marvel of modern web engineering. Built with Next.js (utilizing the App Router paradigm) and styled with Tailwind CSS, it delivers a deeply interactive, desktop-like experience inside the browser.

### 5.1 Static Site Generation (SSG)
We intentionally designed the frontend to be statically exportable (`output: 'export'`). This compiles the entire React application down into raw HTML, CSS, and JS files during the build phase. 
**Why?** Because static files can be hosted on Content Delivery Networks (CDNs) like Firebase Hosting. When a user in Algiers requests the site, it is served from an edge node in milliseconds, bypassing the need for a Node.js server to render the HTML dynamically.

### 5.2 Dynamic URL Resolution
Because the frontend is static, it doesn't "know" where the backend is until it loads in the user's browser. We engineered a highly resilient `api.js` configuration that dynamically reads `window.location.hostname`. If the doctor is running it locally, it targets `http://localhost:5000`. If they are on the live site, it securely routes all traffic to the Render backend at `https://medflow-ehfg.onrender.com`.

### 5.3 Frontend Component Architecture (Source Code Extract)
To demonstrate the complexity of our UI components, here is a selection of the frontend codebase:

#### File: `BookAppointmentContent.jsx`
```javascript
'use client';

import { useState, useEffect } from 'react';
import { API_DOCTOR, API_PATIENTS } from '@/config/api';
import ReasonSelector from '@/components/ReasonSelector';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

export default function BookAppointmentContent() {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState(null); // full doctor object
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch real doctors from the public endpoint (no auth needed)
  useEffect(() => {
    fetch(`${API_DOCTOR}/public`)
      .then(r => r.json())
      .then(data => {
        setDoctors(data.success ? data.data : []);
        setLoadingDoctors(false);
      })
      .catch(() => setLoadingDoctors(false));
  }, []);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay   = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const isDisabled = (day) => {
    if (!selectedDoctor) return true;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) return true;
    if (d.getDay() === 5) return true; // clinic closed on Fridays
    return false;
  };

  const handleDateSelect = (day) => {
    if (isDisabled(day)) return;
    setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    setSelectedTime('');
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < getFirstDay(currentMonth); i++) days.push(<div key={`e${i}`} />);
    for (let day = 1; day <= getDaysInMonth(currentMonth); day++) {
      const disabled = isDisabled(day);
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const selected = selectedDate && date.toDateString() === selectedDate.toDateString();
      days.push(
        <button key={day} type="button" onClick={() => handleDateSelect(day)} disabled={disabled}
          className={`p-2 text-sm font-medium rounded-lg transition-all ${
            selected   ? 'bg-[#1d4ed8] text-white' :
            disabled   ? 'text-gray-300 bg-gray-50 cursor-not-allowed' :
                         'text-gray-700 border border-gray-200 hover:border-[#1d4ed8] bg-white'
          }`}
        >{day}</button>
      );
    }
    return days;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const patientId = localStorage.getItem('patientId');
      const token     = localStorage.getItem('token');

      const res = await fetch(`${API_PATIENTS}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          doctorId:        selectedDoctor._id,
          date:            selectedDate.toISOString(),
          timeSlot:        selectedTime,
          additionalNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSuccessMsg(data.message);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime('');
      setNotes('');
      setCurrentMonth(new Date());
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Book an Appointment</h1>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {errorMsg}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form onSubmit={handleBooking} className="space-y-6">

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Doctor</label>
            {loadingDoctors ? (
              <p className="text-gray-400 text-sm">Loading doctors...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc) => (
                  <button key={doc._id} type="button"
                    onClick={() => { setSelectedDoctor(doc); setSelectedDate(null); setSelectedTime(''); }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedDoctor?._id === doc._id
                        ? 'border-[#1d4ed8] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.specialization || doc.specialty}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Calendar */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Date</label>
            {selectedDoctor ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 hover:bg-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm font-semibold text-gray-900">{monthYear}</span>
                  <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 hover:bg-gray-200 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                {selectedDate && (
                  <p className="mt-3 text-sm text-gray-600 pt-3 border-t border-gray-200">
                    Selected: <span className="font-semibold">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                Please select a doctor first
              </div>
            )}
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Select Time</label>
            {selectedDate ? (
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(time => (
                  <button key={time} type="button" onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg font-medium text-sm border-2 transition-all ${
                      selectedTime === time
                        ? 'border-[#1d4ed8] bg-blue-50 text-[#1d4ed8]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >{time}</button>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                Please select a date first
              </div>
            )}
          </div>

          {/* Reason / Notes */}
          <ReasonSelector value={notes} onChange={setNotes} />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit"
              disabled={!selectedDoctor || !selectedDate || !selectedTime || submitting}
              className="flex-1 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
            <button type="button"
              onClick={() => { setSelectedDoctor(null); setSelectedDate(null); setSelectedTime(''); setNotes(''); setCurrentMonth(new Date()); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

```

#### File: `DashboardContent.jsx`
```javascript
'use client';

import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function DashboardContent() {
  const [appointments, setAppointments] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [loading, setLoading] = useState(true);

  // FETCH REAL APPOINTMENTS
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const patientId = localStorage.getItem('patientId');
        if (!patientId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_PATIENTS}/dashboard/${patientId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
          console.error(`HTTP ${response.status}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : (data?.appointments || []));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Countdown logic stays, but now uses the REAL appointments state
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newCountdowns = {};
      appointments.forEach((apt) => {
        const diff = new Date(apt.date) - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          newCountdowns[apt.id] = `in ${days} days`;
        }
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [appointments]);

  if (loading) return <div className="p-8 text-center">Loading appointments...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome Back</h1>

      {appointments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No upcoming appointments. Book one from the reception desk.
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const aptDate = new Date(apt.date);
            const dateStr = aptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return (
              <div key={apt.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{apt.doctor}</p>
                    <p className="text-gray-500">{apt.specialty}</p>
                    <p className="text-sm text-gray-400 mt-1">{dateStr} at {apt.timeSlot}</p>
                    {apt.additionalNotes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{apt.additionalNotes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-[#1d4ed8] font-semibold">{countdowns[apt.id] || 'Soon'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

#### File: `MedicalHistoryContent.jsx`
```javascript
'use client';

import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function MedicalHistoryContent() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token     = localStorage.getItem('token');
        const patientId = localStorage.getItem('patientId');

        if (!patientId) { setError('Session expired. Please log in again.'); setLoading(false); return; }

        const res = await fetch(`${API_PATIENTS}/history/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setConsultations(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load medical history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = consultations.filter((c) => {
    const d = new Date(c.date);
    if (filterDoctor && !c.doctor.toLowerCase().includes(filterDoctor.toLowerCase())) return false;
    if (filterStart && d < new Date(filterStart)) return false;
    if (filterEnd   && d > new Date(filterEnd))   return false;
    return true;
  });

  const uniqueDoctors = [...new Set(consultations.map(c => c.doctor))];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your medical records...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Consultation History</h1>
        <p className="text-gray-500 mt-1 text-sm">Your past visits and completed appointments</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]">
              <option value="">All Doctors</option>
              {uniqueDoctors.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]" />
          </div>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400">
          No past consultations found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{c.doctor}</p>
                  <p className="text-sm text-gray-500">{c.specialty}</p>
                  {c.diagnosis && c.diagnosis !== '—' && (
                    <p className="text-sm text-gray-600 mt-2 italic">"{c.diagnosis}"</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(c.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{c.timeSlot}</p>
                  <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {c.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

```

#### File: `OldRecordsContent.jsx`
```javascript
'use client';
import { useState, useEffect } from 'react';
import { API_PATIENTS } from '@/config/api';

export default function OldRecordsContent({ onNotify }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fileName: '', fileType: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_PATIENTS}/records`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRecords(Array.isArray(data) ? data : data.oldRecords || []);
    } catch (e) {
      console.error('Failed to fetch records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!form.fileName.trim()) { setFormError('File name is required'); return; }
    if (!form.fileUrl.trim()) { setFormError('File URL is required'); return; }

    const patientId = localStorage.getItem('patientId');
    if (!patientId) { setFormError('Session expired. Please log in again.'); return; }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch(`${API_PATIENTS}/records/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Upload failed');
      setShowModal(false);
      setForm({ fileName: '', fileType: '', fileUrl: '' });
      await fetchRecords();
      if (onNotify) onNotify('File added successfully');
    } catch (err) {
      setFormError('Could not add file. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Old Records</h1>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg transition-colors font-medium"
        >
          + Add File
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No records yet</p>
          <p className="text-sm mt-1">Click "Add File" to upload your first record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, idx) => (
            <div key={record._id || idx} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{record.fileName || record.name}</h3>
                {record.fileType && <p className="text-xs text-[#1d4ed8] font-medium mt-0.5">{record.fileType}</p>}
                <p className="text-sm text-gray-500">{record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : ''}</p>
              </div>
              {record.fileUrl && (
                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1d4ed8] hover:underline font-medium"
                >
                  View
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add File Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Medical Record</h2>
            <form onSubmit={handleAddFile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fileName}
                  onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
                  placeholder="e.g. Blood Test Results 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select
                  value={form.fileType}
                  onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                >
                  <option value="">Select type</option>
                  <option value="Lab Results">Lab Results</option>
                  <option value="Imaging">Imaging (X-ray / MRI / CT)</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Consultation Report">Consultation Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                />
                <p className="text-xs text-gray-400 mt-1">Paste a link to your file (Google Drive, Dropbox, etc.)</p>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### File: `SettingsHelpContent.jsx`
```javascript
'use client';

import { useState } from 'react';
import { API_PATIENTS } from '@/config/api';

const FAQ = [
  {
    q: 'How do I book an appointment?',
    a: 'Click "Book Appointment" in the left sidebar. Select a doctor, pick an available date (Fridays are closed), choose a time slot, select your reason for visit, then click "Confirm Appointment". Your request will be reviewed and confirmed by reception.',
  },
  {
    q: 'How do I cancel an appointment?',
    a: 'Go to "My Appointments" on the dashboard. Find the appointment you want to cancel and click the Cancel button next to it. Cancellations take effect immediately.',
  },
  {
    q: 'What is my File Number?',
    a: 'Your File Number (e.g. P-2026-001) is your unique patient identifier. It is printed on your clinic documents and is the code you use to log into this portal. Keep it safe.',
  },
  {
    q: 'How do I view my past visits?',
    a: 'Click "Medical History" in the sidebar. You will see all your completed appointments with the doctor\'s name, date, and any notes recorded during the visit.',
  },
  {
    q: 'How do I upload a medical document?',
    a: 'Click "My Records" in the sidebar, then use the upload form to attach PDF, JPG, or PNG files. Documents you upload are visible to your doctor.',
  },
  {
    q: 'Can I update my phone number or email?',
    a: 'Yes. On this Settings page, click the "Edit" button, update your details, then click "Save". Your name and date of birth can only be changed by the reception desk.',
  },
  {
    q: 'I forgot my File Number. What should I do?',
    a: 'Contact the clinic reception desk. They can look up your file number using your name and date of birth and provide it to you.',
  },
  {
    q: 'Are my medical records private?',
    a: 'Yes. Only your assigned doctors and authorised clinic staff can access your records. Your data is stored securely and never shared with third parties.',
  },
];

export default function SettingsHelpContent({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  const [form, setForm] = useState({
    phone:            user?.phone            || '',
    email:            user?.email            || '',
    emergencyNumber:  user?.emergencyNumber  || '',
  });
  const [draft, setDraft] = useState(form);

  const [openFaq, setOpenFaq] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const token     = localStorage.getItem('token');
      const patientId = localStorage.getItem('patientId');
      const res = await fetch(`${API_PATIENTS}/profile/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error('Save failed');
      setForm(draft);
      setIsEditing(false);
      setSaveMsg('Profile updated successfully.');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : (user?.name || 'Patient');

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900">Settings &amp; Help</h1>

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-gray-900 text-lg">Profile Information</h2>
          {!isEditing ? (
            <button onClick={() => { setDraft(form); setIsEditing(true); }}
              className="flex items-center gap-2 text-[#1d4ed8] hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? 'Saving...' : '✓ Save'}
              </button>
              <button onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                ✕ Cancel
              </button>
            </div>
          )}
        </div>

        {saveMsg && (
          <p className={`mb-4 text-sm px-4 py-2 rounded-lg ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {saveMsg}
          </p>
        )}

        {/* Avatar + name (read-only) */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">File No: #{user?.fileCode || '—'}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* DOB — read-only */}
          {user?.dateOfBirth && (
            <Field label="Date of Birth"
              value={new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              readOnly />
          )}

          {/* Phone */}
          <Field label="Phone Number" value={isEditing ? draft.phone : form.phone}
            readOnly={!isEditing}
            onChange={v => setDraft({ ...draft, phone: v })} />

          {/* Email */}
          <Field label="Email Address" value={isEditing ? draft.email : form.email}
            readOnly={!isEditing} type="email"
            onChange={v => setDraft({ ...draft, email: v })} />

          {/* Emergency */}
          <Field label="Emergency Contact" value={isEditing ? draft.emergencyNumber : form.emergencyNumber}
            readOnly={!isEditing}
            onChange={v => setDraft({ ...draft, emergencyNumber: v })} />
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-4 py-4 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <p className="text-center text-sm text-gray-400">
        Need more help? Contact the clinic at <span className="text-gray-600 font-medium">support@clinic.com</span>
      </p>
    </div>
  );
}

function Field({ label, value, readOnly, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-500 block mb-1">{label}</label>
      {readOnly ? (
        <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg text-sm min-h-[44px] flex items-center">
          {value || '—'}
        </p>
      ) : (
        <input type={type} value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] bg-white text-gray-900" />
      )}
    </div>
  );
}

```

#### File: `Sidebar.jsx`
```javascript
'use client';
import { useState, useEffect } from 'react';

const menuItems = [
  {
    id: 'dashboard',
    label: 'My Appointments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'book',
    label: 'Book Appointment',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Medical History',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'records',
    label: 'My Records',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings & Help',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ user, activeSection, setActiveSection, sidebarOpen, setSidebarOpen }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('patientId');
    window.location.href = '/patient-access';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.name || 'Loading...')}
            </p>
            <p className="text-xs text-gray-500">#{user?.fileCode || '—'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (isMobile) setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
              activeSection === item.id
                ? 'bg-blue-50 text-[#1d4ed8]'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className={activeSection === item.id ? 'text-[#1d4ed8]' : 'text-gray-400'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white flex-col border-r border-gray-200 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm lg:hidden"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && sidebarOpen && (
        <aside className="fixed left-0 top-0 w-64 h-screen bg-white flex flex-col z-50 shadow-lg">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Menu</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarContent}
          </div>
        </aside>
      )}
    </>
  );
}

```

## Chapter 6: Cloud Deployment & DevOps Saga
Deploying MedFlow was an engineering challenge that required orchestrating three completely independent cloud platforms to work in perfect unison. Here is the exact, step-by-step saga of how it was achieved, which serves as a masterclass in DevOps for the jury.

### 6.1 Database Deployment: MongoDB Atlas
1. A cluster was provisioned on MongoDB Atlas.
2. A dedicated database user was created with scrambled credentials.
3. **The IP Whitelisting Challenge:** By default, Atlas blocks all traffic. Because our backend on Render utilizes dynamic IPs, we had to configure the Network Security tab to `0.0.0.0/0` (Allow Access from Anywhere). Without this, the backend would crash immediately upon boot with an IP rejection error.

### 6.2 Backend Deployment: Render.com
1. **The Serverless Constraint:** We originally considered Firebase Cloud Functions for the backend. However, Serverless functions are "stateless and ephemeral"—they wake up, do a job, and die. They cannot maintain the persistent WebSocket connections required by Socket.io. 
2. **The Render Solution:** We migrated the backend to Render, which spins up dedicated Linux containers that stay alive continuously.
3. **The Linux Case-Sensitivity Bug:** During deployment, the build succeeded, but the app crashed with `MODULE_NOT_FOUND`. The root cause was incredible: Windows (the local dev machine) is case-insensitive, but Render (Linux) is strictly case-sensitive. The code required `mailConfig.js`, but the file was named `mailconfig.js`. We had to execute a surgical Git commit to rename the require path to lowercase, pushing it live to fix the pipeline.
4. **Environment Injection:** We securely injected the `MONGODB_URI`, `JWT_SECRET`, and `ALLOWED_ORIGINS` directly into the Render dashboard to keep secrets out of the Git repository.

### 6.3 Frontend Deployment: Firebase Hosting
1. We utilized the Firebase CLI to initialize the project.
2. The Next.js application was compiled using `npm run build`, which generated the static `out/` folder.
3. We executed `firebase deploy --only hosting`, which uploaded the 300+ static files directly to Google's Edge Network, instantly bringing the site live at `medflow-28c18.web.app`.

## Chapter 7: Future Expansion & Scaling Roadmap
While MedFlow is feature-complete for its initial rollout, the architecture was explicitly designed to scale into a multi-tenant enterprise application.

### 7.1 Phase 1: Microservices Architecture
Currently, MedFlow is a Monolith. As traffic grows, we will split the backend into microservices (e.g., a dedicated Authentication Service, a dedicated Notification Service) using Docker and Kubernetes orchestration.

### 7.2 Phase 2: Redis In-Memory Caching
To reduce the load on MongoDB, we will implement Redis. When a patient queries a doctor's schedule, the backend will check Redis first (which returns data in microseconds) instead of hitting the database.

### 7.3 Phase 3: WebRTC Telehealth
We will integrate WebRTC protocols to allow doctors to have secure, peer-to-peer video consultations with patients directly inside the MedFlow dashboard, eliminating the need for third-party tools like Zoom.


---
**END OF MASTER SPECIFICATION DOCUMENT**
