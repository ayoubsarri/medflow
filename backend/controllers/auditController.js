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
