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
