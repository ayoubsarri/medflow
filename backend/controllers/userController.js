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
