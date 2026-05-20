require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin        = require('./models/Admin');
const Doctor       = require('./models/Doctor');
const Receptionist = require('./models/Receptionist');
const Patient      = require('./models/Patient');
const Appointment  = require('./models/Appointment');
const Consultation = require('./models/Consultation');
const SystemSettings = require('./models/SystemSettings');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a Date for a calendar date string + hour/minute, or null for Fridays */
function dt(dateStr, hour, minute = 0) {
  const d = new Date(dateStr);
  if (d.getDay() === 5) return null; // clinic closed on Fridays
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Format a Date to "Month DD, YYYY" string for Consultation.date */
function fmtDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { tlsAllowInvalidCertificates: true });
    console.log('✅ Connected to MongoDB');

    // -----------------------------------------------------------------------
    // 1. CLEAR COLLECTIONS
    // -----------------------------------------------------------------------
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      Receptionist.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Consultation.deleteMany({}),
      SystemSettings.deleteMany({})
    ]);
    console.log('✅ Collections cleared');

    // -----------------------------------------------------------------------
    // 2. PASSWORDS  (all staff use password123 — matches login page demo)
    // -----------------------------------------------------------------------
    const pw = await bcrypt.hash('password123', 10);

    // -----------------------------------------------------------------------
    // 3. ADMIN
    // -----------------------------------------------------------------------
    const [admin] = await Admin.insertMany([{
      name: 'Lyna Lakel',
      email: 'admin@clinic.com',
      password: pw,
      role: 'Admin',
      status: 'Active',
      isAdmin: true,
      joined: new Date('2024-01-15'),
      consultations: 0, appointmentsManaged: 340, tasksCompleted: 120, hoursWorked: 980
    }]);
    console.log(`✅ Admin: ${admin.email}`);

    // -----------------------------------------------------------------------
    // 4. DOCTORS
    // -----------------------------------------------------------------------
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Nouar Ahmed',
        email: 'dr.nouar@clinic.com',
        password: pw,
        role: 'Doctor',
        specialization: 'General Medicine',
        specialty: 'General Medicine',
        phone: '0551-23-45-67',
        status: 'Active',
        isAdmin: false,
        joined: new Date('2023-03-01'),
        consultations: 412, appointmentsManaged: 0, tasksCompleted: 0, hoursWorked: 1640
      },
      {
        name: 'Dr. Gherbi Sarah',
        email: 'dr.sarah@clinic.com',
        password: pw,
        role: 'Doctor',
        specialization: 'Cardiology',
        specialty: 'Cardiology',
        phone: '0552-34-56-78',
        status: 'Active',
        isAdmin: false,
        joined: new Date('2022-09-10'),
        consultations: 388, appointmentsManaged: 0, tasksCompleted: 0, hoursWorked: 1820
      },
      {
        name: 'Dr. Bensalem Karim',
        email: 'dr.karim@clinic.com',
        password: pw,
        role: 'Doctor',
        specialization: 'Pediatrics',
        specialty: 'Pediatrics',
        phone: '0553-45-67-89',
        status: 'Active',
        isAdmin: false,
        joined: new Date('2024-02-20'),
        consultations: 276, appointmentsManaged: 0, tasksCompleted: 0, hoursWorked: 1100
      }
    ]);
    console.log(`✅ Doctors: ${doctors.map(d => d.email).join(', ')}`);
    const [docNouar, docSarah, docKarim] = doctors;

    // -----------------------------------------------------------------------
    // 5. RECEPTIONISTS
    // -----------------------------------------------------------------------
    const receptionists = await Receptionist.insertMany([
      {
        name: 'Meziane Karima',
        email: 'reception@clinic.com',
        password: pw,
        role: 'Receptionist',
        phone: '0554-56-78-90',
        status: 'Active',
        isAdmin: false,
        joined: new Date('2023-06-01'),
        consultations: 0, appointmentsManaged: 510, tasksCompleted: 200, hoursWorked: 1600
      },
      {
        name: 'Belkadi Hamza',
        email: 'reception2@clinic.com',
        password: pw,
        role: 'Receptionist',
        phone: '0555-67-89-01',
        status: 'Active',
        isAdmin: false,
        joined: new Date('2024-04-15'),
        consultations: 0, appointmentsManaged: 180, tasksCompleted: 75, hoursWorked: 520
      }
    ]);
    console.log(`✅ Receptionists: ${receptionists.map(r => r.email).join(', ')}`);

    // -----------------------------------------------------------------------
    // 6. PATIENTS  (30 Algerian patients)
    // -----------------------------------------------------------------------
    const patientData = [
      // fileCode, firstName, lastName, dob, phone, email, chronic, allergies, hereditary, emergency
      ['P-2026-001','Youcef','Mammeri','1985-03-14','0551-11-22-33','youcef.mammeri@gmail.com','Diabète de type 2','Pénicilline','Diabète','0661-11-22-33'],
      ['P-2026-002','Amina','Khelifi','1972-07-28','0662-22-33-44','amina.khelifi@gmail.com','Hypertension artérielle','Aucune','HTA','0772-22-33-44'],
      ['P-2026-003','Sofiane','Hadj','1990-11-05','0773-33-44-55','sofiane.hadj@gmail.com','Aucune','Aspirine','Aucune','0553-33-44-55'],
      ['P-2026-004','Nadia','Boualem','1968-01-20','0554-44-55-66','nadia.boualem@gmail.com','Asthme','Poussière','Asthme','0664-44-55-66'],
      ['P-2026-005','Omar','Ferhat','1955-09-12','0665-55-66-77','omar.ferhat@gmail.com','Insuffisance coronarienne','Iode','Maladies cardiaques','0775-55-66-77'],
      ['P-2026-006','Fatima','Rahmani','1980-04-30','0776-66-77-88','fatima.rahmani@gmail.com','Aucune','Aucune','Aucune','0556-66-77-88'],
      ['P-2026-007','Réda','Bouzidi','1993-12-08','0557-77-88-99','reda.bouzidi@gmail.com','Aucune','Sulfonamides','Aucune','0667-77-88-99'],
      ['P-2026-008','Lynda','Meslem','1977-06-17','0668-88-99-00','lynda.meslem@gmail.com','Hypothyroïdie','Aucune','Thyroïde','0778-88-99-00'],
      ['P-2026-009','Bilal','Touati','1988-02-22','0779-99-00-11','bilal.touati@gmail.com','Aucune','Latex','Aucune','0559-99-00-11'],
      ['P-2026-010','Meriem','Ouali','1965-08-03','0551-10-20-30','meriem.ouali@gmail.com','Diabète de type 2, HTA','Pénicilline','Diabète, HTA','0661-10-20-30'],
      ['P-2026-011','Abdelkader','Benouis','1948-05-25','0662-20-30-40','abdelkader.benouis@gmail.com','Insuffisance rénale chronique','Aucune','IRC','0772-20-30-40'],
      ['P-2026-012','Hanane','Harbi','1995-10-14','0773-30-40-50','hanane.harbi@gmail.com','Aucune','Arachides','Aucune','0553-30-40-50'],
      ['P-2026-013','Tarek','Belkaid','1982-03-07','0554-40-50-60','tarek.belkaid@gmail.com','Ulcère gastrique','Ibuprofène','Ulcères','0664-40-50-60'],
      ['P-2026-014','Rania','Morsli','1999-07-19','0665-50-60-70','rania.morsli@gmail.com','Aucune','Aucune','Aucune','0775-50-60-70'],
      ['P-2026-015','Hichem','Benali','1971-12-01','0776-60-70-80','hichem.benali@gmail.com','HTA','Aucune','HTA, AVC','0556-60-70-80'],
      ['P-2026-016','Sonia','Saidi','1987-09-09','0557-70-80-90','sonia.saidi@gmail.com','Aucune','Pénicilline','Aucune','0667-70-80-90'],
      ['P-2026-017','Nassim','Chalal','1975-04-15','0668-80-90-01','nassim.chalal@gmail.com','Diabète de type 2','Aucune','Diabète','0778-80-90-01'],
      ['P-2026-018','Imane','Boukhalfa','1991-01-28','0779-90-01-12','imane.boukhalfa@gmail.com','Aucune','Aucune','Aucune','0559-90-01-12'],
      ['P-2026-019','Walid','Mahmoudi','1963-06-11','0551-12-23-34','walid.mahmoudi@gmail.com','Insuffisance coronarienne','Warfarine','Maladies cardiaques','0661-12-23-34'],
      ['P-2026-020','Djamila','Bouchama','1979-11-24','0662-23-34-45','djamila.bouchama@gmail.com','Asthme','Poussière, Pollen','Asthme','0772-23-34-45'],
      ['P-2026-021','Anis','Chebli','1994-08-16','0773-34-45-56','anis.chebli@gmail.com','Aucune','Aucune','Aucune','0553-34-45-56'],
      ['P-2026-022','Nawel','Laouadi','1969-02-04','0554-45-56-67','nawel.laouadi@gmail.com','HTA, Diabète type 2','Aspirine','HTA, Diabète','0664-45-56-67'],
      ['P-2026-023','Lotfi','Amrani','1983-05-20','0665-56-67-78','lotfi.amrani@gmail.com','Aucune','Codéine','Aucune','0775-56-67-78'],
      ['P-2026-024','Samira','Guendouz','1958-09-30','0776-67-78-89','samira.guendouz@gmail.com','Insuffisance cardiaque','Aucune','Maladies cardiaques','0556-67-78-89'],
      ['P-2026-025','Fares','Sebbane','1997-03-13','0557-78-89-90','fares.sebbane@gmail.com','Aucune','Aucune','Aucune','0667-78-89-90'],
      ['P-2026-026','Assia','Guessoum','1986-07-07','0668-89-90-01','assia.guessoum@gmail.com','Hypothyroïdie','Aucune','Thyroïde','0778-89-90-01'],
      ['P-2026-027','Mohamed','Slimani','1961-12-28','0779-90-11-22','mohamed.slimani@gmail.com','Diabète type 2, Hypertension','Pénicilline','Diabète, HTA','0559-90-11-22'],
      ['P-2026-028','Zahra','Addad','1973-04-02','0551-11-33-55','zahra.addad@gmail.com','Aucune','Sulfates','Aucune','0661-11-33-55'],
      ['P-2026-029','Amine','Kerroumi','2001-10-17','0662-22-44-66','amine.kerroumi@gmail.com','Aucune','Aucune','Aucune','0772-22-44-66'],
      ['P-2026-030','Yasmine','Belloula','1984-06-23','0773-33-55-77','yasmine.belloula@gmail.com','Aucune','Pénicilline','Aucune','0553-33-55-77'],
    ];

    const patients = await Patient.insertMany(patientData.map(([fileCode,firstName,lastName,dob,phone,email,chronic,allergies,hereditary,emergency]) => ({
      fileCode,
      firstName,
      lastName,
      dateOfBirth: new Date(dob),
      phone,
      email,
      chronicConditions: chronic,
      allergies,
      hereditaryConditions: hereditary,
      emergencyNumber: emergency,
      isExisting: true,
      reminders: { email: true },
      oldRecords: []
    })));
    console.log(`✅ Patients: ${patients.length}`);

    // -----------------------------------------------------------------------
    // 7. APPOINTMENTS
    // -----------------------------------------------------------------------
    // Clinic is open Mon–Thu, Sat–Sun; CLOSED Friday.
    // Today = 2026-05-20 (Wednesday)
    // Past (Completed / Cancelled / No Show):
    //   April 2026: 2,6,7,8,9,13,14,16,20,21,22,23,27,28,29,30
    //   May 1–19:   4,5,6,7,11,12,13,14,18,19
    // Today (2026-05-20): Confirmed + Checked-In
    // Future: 2026-05-21,25,26,27,28 and June 2026
    // -----------------------------------------------------------------------

    const TIME_SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];
    const REASONS = [
      'Consultation générale',
      'Suivi diabète',
      'Suivi hypertension',
      'Renouvellement ordonnance',
      'Résultats analyses biologiques',
      'Douleurs thoraciques',
      'Suivi cardiologique',
      'Vaccination',
      'Contrôle pédiatrique',
      'Maux de dos / douleurs articulaires',
      'Problèmes respiratoires',
      'Surveillance tension artérielle',
      'Céphalées / migraines',
      'Troubles digestifs',
      'Bilan de santé annuel',
      'Suivi post-opératoire',
    ];

    // Shorthand
    const p  = (i) => patients[i]._id;
    const d0 = docNouar._id;
    const d1 = docSarah._id;
    const d2 = docKarim._id;
    const r  = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const rawAppts = [
      // ── April 2026 (all Completed unless noted) ──
      { patient: p(0),  doctor: d0, date: '2026-04-02', h: 8,  status: 'Completed', notes: REASONS[1] },
      { patient: p(1),  doctor: d1, date: '2026-04-02', h: 9,  status: 'Completed', notes: REASONS[2] },
      { patient: p(2),  doctor: d2, date: '2026-04-02', h: 10, status: 'Completed', notes: REASONS[8] },
      { patient: p(3),  doctor: d0, date: '2026-04-06', h: 8,  status: 'Completed', notes: REASONS[10] },
      { patient: p(4),  doctor: d1, date: '2026-04-06', h: 9,  status: 'Completed', notes: REASONS[5] },
      { patient: p(5),  doctor: d2, date: '2026-04-07', h: 8,  status: 'Completed', notes: REASONS[0] },
      { patient: p(6),  doctor: d0, date: '2026-04-07', h: 10, status: 'Completed', notes: REASONS[14] },
      { patient: p(7),  doctor: d1, date: '2026-04-08', h: 9,  status: 'Completed', notes: REASONS[6] },
      { patient: p(8),  doctor: d2, date: '2026-04-08', h: 11, status: 'Cancelled',  notes: REASONS[8] },
      { patient: p(9),  doctor: d0, date: '2026-04-09', h: 8,  status: 'Completed', notes: REASONS[1] },
      { patient: p(10), doctor: d1, date: '2026-04-09', h: 10, status: 'Completed', notes: REASONS[11] },
      { patient: p(11), doctor: d2, date: '2026-04-13', h: 9,  status: 'Completed', notes: REASONS[8] },
      { patient: p(12), doctor: d0, date: '2026-04-13', h: 11, status: 'Completed', notes: REASONS[12] },
      { patient: p(13), doctor: d1, date: '2026-04-14', h: 8,  status: 'No Show',   notes: REASONS[0] },
      { patient: p(14), doctor: d0, date: '2026-04-14', h: 13, status: 'Completed', notes: REASONS[2] },
      { patient: p(15), doctor: d2, date: '2026-04-16', h: 9,  status: 'Completed', notes: REASONS[3] },
      { patient: p(16), doctor: d1, date: '2026-04-16', h: 14, status: 'Completed', notes: REASONS[1] },
      { patient: p(17), doctor: d0, date: '2026-04-20', h: 8,  status: 'Completed', notes: REASONS[9] },
      { patient: p(18), doctor: d1, date: '2026-04-20', h: 10, status: 'Completed', notes: REASONS[5] },
      { patient: p(19), doctor: d2, date: '2026-04-21', h: 9,  status: 'Completed', notes: REASONS[10] },
      { patient: p(20), doctor: d0, date: '2026-04-21', h: 11, status: 'Completed', notes: REASONS[14] },
      { patient: p(21), doctor: d1, date: '2026-04-22', h: 8,  status: 'Completed', notes: REASONS[11] },
      { patient: p(22), doctor: d2, date: '2026-04-22', h: 13, status: 'Cancelled',  notes: REASONS[0] },
      { patient: p(23), doctor: d0, date: '2026-04-23', h: 9,  status: 'Completed', notes: REASONS[6] },
      { patient: p(24), doctor: d1, date: '2026-04-23', h: 15, status: 'Completed', notes: REASONS[4] },
      { patient: p(25), doctor: d2, date: '2026-04-27', h: 8,  status: 'Completed', notes: REASONS[3] },
      { patient: p(26), doctor: d0, date: '2026-04-27', h: 10, status: 'Completed', notes: REASONS[1] },
      { patient: p(0),  doctor: d1, date: '2026-04-28', h: 9,  status: 'Completed', notes: REASONS[6] },
      { patient: p(1),  doctor: d2, date: '2026-04-28', h: 11, status: 'Completed', notes: REASONS[8] },
      { patient: p(27), doctor: d0, date: '2026-04-29', h: 8,  status: 'Completed', notes: REASONS[2] },
      { patient: p(28), doctor: d1, date: '2026-04-29', h: 14, status: 'Completed', notes: REASONS[7] },
      { patient: p(29), doctor: d2, date: '2026-04-30', h: 9,  status: 'Completed', notes: REASONS[0] },
      { patient: p(2),  doctor: d0, date: '2026-04-30', h: 10, status: 'Completed', notes: REASONS[13] },

      // ── May 1–19, 2026 ──
      { patient: p(3),  doctor: d0, date: '2026-05-04', h: 8,  status: 'Completed', notes: REASONS[10] },
      { patient: p(4),  doctor: d1, date: '2026-05-04', h: 9,  status: 'Completed', notes: REASONS[5] },
      { patient: p(5),  doctor: d2, date: '2026-05-05', h: 10, status: 'Completed', notes: REASONS[8] },
      { patient: p(6),  doctor: d0, date: '2026-05-05', h: 14, status: 'Completed', notes: REASONS[12] },
      { patient: p(7),  doctor: d1, date: '2026-05-06', h: 9,  status: 'Completed', notes: REASONS[2] },
      { patient: p(8),  doctor: d2, date: '2026-05-06', h: 11, status: 'Completed', notes: REASONS[0] },
      { patient: p(9),  doctor: d0, date: '2026-05-07', h: 8,  status: 'Absent',    notes: REASONS[1] },
      { patient: p(10), doctor: d1, date: '2026-05-07', h: 13, status: 'Completed', notes: REASONS[6] },
      { patient: p(11), doctor: d2, date: '2026-05-11', h: 9,  status: 'Completed', notes: REASONS[8] },
      { patient: p(12), doctor: d0, date: '2026-05-11', h: 10, status: 'Completed', notes: REASONS[3] },
      { patient: p(13), doctor: d1, date: '2026-05-12', h: 8,  status: 'Completed', notes: REASONS[0] },
      { patient: p(14), doctor: d2, date: '2026-05-12', h: 14, status: 'Completed', notes: REASONS[9] },
      { patient: p(15), doctor: d0, date: '2026-05-13', h: 9,  status: 'Completed', notes: REASONS[2] },
      { patient: p(16), doctor: d1, date: '2026-05-13', h: 11, status: 'Completed', notes: REASONS[11] },
      { patient: p(17), doctor: d2, date: '2026-05-14', h: 8,  status: 'Completed', notes: REASONS[4] },
      { patient: p(18), doctor: d0, date: '2026-05-14', h: 15, status: 'Cancelled',  notes: REASONS[14] },
      { patient: p(19), doctor: d1, date: '2026-05-18', h: 9,  status: 'Completed', notes: REASONS[5] },
      { patient: p(20), doctor: d2, date: '2026-05-18', h: 10, status: 'Completed', notes: REASONS[10] },
      { patient: p(21), doctor: d0, date: '2026-05-19', h: 8,  status: 'Completed', notes: REASONS[0] },
      { patient: p(22), doctor: d1, date: '2026-05-19', h: 13, status: 'Completed', notes: REASONS[6] },
      { patient: p(23), doctor: d2, date: '2026-05-19', h: 15, status: 'Completed', notes: REASONS[3] },

      // ── Today: 2026-05-20 (Wednesday) ──
      { patient: p(0),  doctor: d0, date: '2026-05-20', h: 8,  status: 'Checked-In', notes: REASONS[1] },
      { patient: p(1),  doctor: d1, date: '2026-05-20', h: 9,  status: 'Checked-In', notes: REASONS[6] },
      { patient: p(2),  doctor: d2, date: '2026-05-20', h: 9,  status: 'Checked-In', notes: REASONS[8] },
      { patient: p(3),  doctor: d0, date: '2026-05-20', h: 10, status: 'Confirmed',  notes: REASONS[0] },
      { patient: p(4),  doctor: d1, date: '2026-05-20', h: 10, status: 'Confirmed',  notes: REASONS[11] },
      { patient: p(5),  doctor: d2, date: '2026-05-20', h: 11, status: 'Confirmed',  notes: REASONS[3] },
      { patient: p(6),  doctor: d0, date: '2026-05-20', h: 13, status: 'Confirmed',  notes: REASONS[14] },
      { patient: p(7),  doctor: d1, date: '2026-05-20', h: 14, status: 'Confirmed',  notes: REASONS[2] },

      // ── Future: May 21–28 ──
      { patient: p(8),  doctor: d0, date: '2026-05-21', h: 8,  status: 'Confirmed', notes: REASONS[0] },
      { patient: p(9),  doctor: d1, date: '2026-05-21', h: 9,  status: 'Confirmed', notes: REASONS[5] },
      { patient: p(10), doctor: d2, date: '2026-05-21', h: 10, status: 'Confirmed', notes: REASONS[8] },
      { patient: p(24), doctor: d0, date: '2026-05-21', h: 14, status: 'Pending',   notes: REASONS[7] },
      { patient: p(11), doctor: d0, date: '2026-05-25', h: 9,  status: 'Pending',   notes: REASONS[3] },
      { patient: p(12), doctor: d1, date: '2026-05-25', h: 10, status: 'Pending',   notes: REASONS[12] },
      { patient: p(13), doctor: d2, date: '2026-05-25', h: 11, status: 'Pending',   notes: REASONS[0] },
      { patient: p(25), doctor: d0, date: '2026-05-26', h: 8,  status: 'Pending',   notes: REASONS[1] },
      { patient: p(26), doctor: d1, date: '2026-05-26', h: 13, status: 'Pending',   notes: REASONS[6] },
      { patient: p(14), doctor: d2, date: '2026-05-27', h: 9,  status: 'Pending',   notes: REASONS[9] },
      { patient: p(15), doctor: d0, date: '2026-05-27', h: 10, status: 'Pending',   notes: REASONS[2] },
      { patient: p(27), doctor: d1, date: '2026-05-28', h: 8,  status: 'Pending',   notes: REASONS[4] },
      { patient: p(28), doctor: d2, date: '2026-05-28', h: 11, status: 'Pending',   notes: REASONS[10] },

      // ── June 2026 ──
      { patient: p(16), doctor: d0, date: '2026-06-01', h: 8,  status: 'Pending', notes: REASONS[1] },
      { patient: p(17), doctor: d1, date: '2026-06-01', h: 9,  status: 'Pending', notes: REASONS[6] },
      { patient: p(18), doctor: d2, date: '2026-06-01', h: 10, status: 'Pending', notes: REASONS[8] },
      { patient: p(29), doctor: d0, date: '2026-06-02', h: 9,  status: 'Pending', notes: REASONS[0] },
      { patient: p(0),  doctor: d1, date: '2026-06-02', h: 13, status: 'Pending', notes: REASONS[11] },
      { patient: p(19), doctor: d0, date: '2026-06-03', h: 8,  status: 'Pending', notes: REASONS[14] },
      { patient: p(20), doctor: d2, date: '2026-06-03', h: 10, status: 'Pending', notes: REASONS[3] },
      { patient: p(1),  doctor: d1, date: '2026-06-04', h: 9,  status: 'Pending', notes: REASONS[6] },
      { patient: p(21), doctor: d0, date: '2026-06-08', h: 8,  status: 'Pending', notes: REASONS[2] },
      { patient: p(22), doctor: d1, date: '2026-06-08', h: 11, status: 'Pending', notes: REASONS[0] },
      { patient: p(2),  doctor: d2, date: '2026-06-09', h: 9,  status: 'Pending', notes: REASONS[9] },
      { patient: p(23), doctor: d0, date: '2026-06-10', h: 10, status: 'Pending', notes: REASONS[4] },
    ];

    // Build appointment documents (skip any null dates — shouldn't happen since we avoided Fridays)
    const apptDocs = rawAppts.map(({ patient, doctor, date, h, status, notes }) => {
      const d = new Date(date);
      d.setHours(h, 0, 0, 0);
      const hh = String(h).padStart(2, '0');
      return {
        patient,
        doctor,
        clinicName: 'MedFlow',
        date: d,
        timeSlot: `${hh}:00`,
        duration: 30,
        status,
        additionalNotes: notes
      };
    });

    const appointments = await Appointment.insertMany(apptDocs);
    console.log(`✅ Appointments: ${appointments.length}`);

    // -----------------------------------------------------------------------
    // 8. CONSULTATIONS  (for every Completed appointment)
    // -----------------------------------------------------------------------
    const completedAppts = appointments.filter(a => a.status === 'Completed');

    const prescriptions = [
      'Metformine 500mg — 1 cp matin et soir pendant 30 jours.\nContrôle glycémique dans 1 mois.',
      'Amlodipine 5mg — 1 cp le matin.\nRamipril 5mg — 1 cp le soir. Régime hyposodé.',
      'Ventoline 100µg spray — 2 bouffées si besoin (max 4/jour).\nBéclométasone 250µg — 2 bouffées matin et soir.',
      'Paracétamol 1g — 1 cp toutes les 6h si douleur.\nIbuprofène 400mg — après repas 3x/jour pendant 5 jours.',
      'Atorvastatine 20mg — 1 cp le soir.\nAspégic 100mg — 1 cp/jour pendant le repas.',
      'Lévothyroxine 75µg — 1 cp le matin à jeun.\nContrôle TSH dans 6 semaines.',
      'Amoxicilline 1g — 1 cp matin et soir pendant 7 jours.\nParacétamol 500mg si fièvre.',
      'Oméprazole 20mg — 1 cp le matin à jeun pendant 4 semaines.\nRégime sans épices.',
      'Cétirizine 10mg — 1 cp le soir pendant 15 jours.\nÉviter l\'exposition aux allergènes.',
      'Insuline glargine 10 UI le soir.\nSurveillance glycémique quotidienne.',
    ];

    const justifications = [
      'Le patient présente une fatigue chronique nécessitant 3 jours de repos à domicile (du 20 au 22 du mois en cours). Il est inapte à toute activité physique ou professionnelle pendant cette période.',
      'Suite à une consultation cardiologique, le patient est placé en arrêt de travail pour une durée de 5 jours (du 14 au 18 du mois en cours) en raison d\'une poussée hypertensive.',
      'Certificat médical délivré attestant que le patient est suivi pour une pathologie chronique nécessitant des examens réguliers. Ces absences sont médicalement justifiées.',
    ];

    const consultationDocs = completedAppts.map((appt, i) => {
      // Find the doctor name for this appointment
      const doc = doctors.find(d => d._id.equals(appt.doctor));
      return {
        appointment_id: appt._id,
        patient_id: appt.patient,
        doctorName: doc ? doc.name : 'Inconnu',
        date: fmtDate(appt.date),
        time: appt.timeSlot,
        prescriptionFile: `prescriptions/presc-${String(i + 1).padStart(3, '0')}.pdf`,
        justificationFile: i % 5 === 0 ? `justifications/just-${String(i + 1).padStart(3, '0')}.pdf` : null,
        followUpDate: new Date(new Date(appt.date).setDate(new Date(appt.date).getDate() + (i % 3 === 0 ? 14 : 30))),
        attachments: i % 4 === 0 ? [`lab-results-${String(i + 1).padStart(3, '0')}.pdf`] : []
      };
    });

    const consultations = await Consultation.insertMany(consultationDocs);
    console.log(`✅ Consultations: ${consultations.length}`);

    // -----------------------------------------------------------------------
    // 9. SYSTEM SETTINGS
    // -----------------------------------------------------------------------
    await SystemSettings.create({
      clinicName: 'MedFlow',
      address: '12 Rue Didouche Mourad, Alger',
      phone: '023-45-67-89',
      workingHours: '08:00 - 18:00',
      autoBackupSchedule: 'Daily at 02:00',
      lastBackup: new Date()
    });

    // -----------------------------------------------------------------------
    // Summary
    // -----------------------------------------------------------------------
    console.log('\n🎉 Seed complete!');
    console.log(`   Admin:           1  (admin@clinic.com / password123)`);
    console.log(`   Doctors:         ${doctors.length}  (dr.nouar@clinic.com, dr.sarah@clinic.com, dr.karim@clinic.com / password123)`);
    console.log(`   Receptionists:   ${receptionists.length}  (reception@clinic.com / password123)`);
    console.log(`   Patients:        ${patients.length}`);
    console.log(`   Appointments:    ${appointments.length}`);
    console.log(`   Consultations:   ${consultations.length}  (for all completed appts)`);
    console.log('\n📋 Patient portal login samples:');
    patients.slice(0, 5).forEach(p => console.log(`   ${p.fileCode}  →  ${p.firstName} ${p.lastName}`));

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
};

seedData();
