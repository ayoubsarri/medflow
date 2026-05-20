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
