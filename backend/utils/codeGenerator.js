const Patient = require('../models/Patient');

/**
 * Generates a code like "P-2026-001"
 * It counts existing patients to increment the final number.
 */
const generateFileCode = async () => {
    const year = new Date().getFullYear();
    const count = await Patient.countDocuments();
    // Adds leading zeros so 1 becomes 001, 10 becomes 010
    const sequence = (count + 1).toString().padStart(3, '0'); 
    return `P-${year}-${sequence}`;
};

module.exports = generateFileCode;