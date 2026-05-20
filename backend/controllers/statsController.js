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
