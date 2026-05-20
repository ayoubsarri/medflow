/**
 * =============================================================================
 * AUTHENTICATION MIDDLEWARE — middleware/auth.js
 * =============================================================================
 *
 * STUDENT DEFENSE NOTE:
 * This file contains all authentication and authorization middleware for the
 * MedFlow backend. It exports three functions:
 *
 *   1. verifyToken    — Checks if the user sent a valid JWT token
 *   2. requireRole    — Checks if the user has one of the allowed roles
 *   3. requireAdmin   — Shortcut for requireRole('Admin')
 *
 * USAGE PATTERN:
 *   const { verifyToken, requireAdmin } = require('../middleware/auth');
 *   router.get('/staff', verifyToken, requireAdmin, controller.getStaff);
 *
 * WHY WE MERGED:
 * The project previously had two files (auth.js and authMiddleware.js) doing
 * overlapping work. This single file replaces both to avoid confusion.
 *
 * BACKWARDS COMPATIBILITY:
 * We also export `protect` as an alias for `verifyToken` so that existing
 * route files that use `const { protect } = require(...)` keep working
 * without any changes to their route handler lines.
 * =============================================================================
 */

const jwt = require('jsonwebtoken');

// =============================================================================
// 1. VERIFY TOKEN
// =============================================================================

// WHAT IT DOES: Extracts the JWT from the Authorization header, verifies it,
//   and attaches the decoded user data (id, role, name) to req.user.
// HOW TO USE IT: router.get('/path', verifyToken, controller)
const verifyToken = (req, res, next) => {
    let token;

    // Extract the token from the "Authorization" header
    // The standard format expected from the frontend is: "Bearer <token_string>"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found, block the request
    if (!token) {
        return res.status(401).json({
            message: 'Not authorized to access this route. No token provided.'
        });
    }

    try {
        // Verify the token using our secret key
        // This will throw an error if the token is invalid, tampered with, or expired.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_key_for_development'
        );

        // Attach the decoded user information to the request object
        // This makes `req.user` available in any controller that comes after this middleware.
        req.user = decoded;

        // Proceed to the next middleware or the main controller
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({
            message: 'Not authorized. Token is invalid or expired.'
        });
    }
};

// =============================================================================
// 2. REQUIRE ROLE
// =============================================================================

// WHAT IT DOES: Checks that the authenticated user's role is in the allowed
//   list; returns 403 Forbidden if not.
// HOW TO USE IT: router.get('/path', verifyToken, requireRole('Admin', 'Doctor'), controller)
const requireRole = (...roles) => {
    return (req, res, next) => {
        // verifyToken must run before this — it sets req.user
        if (!req.user) {
            return res.status(401).json({
                message: 'Not authorized. You must be logged in.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`
            });
        }

        next();
    };
};

// =============================================================================
// 3. REQUIRE ADMIN (shortcut)
// =============================================================================

// WHAT IT DOES: A convenience shortcut that checks the user is an Admin.
// HOW TO USE IT: router.get('/path', verifyToken, requireAdmin, controller)
const requireAdmin = requireRole('Admin');

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
    verifyToken,
    requireRole,
    requireAdmin,

    // Backwards-compatible alias so existing routes using { protect } still work
    protect: verifyToken
};
