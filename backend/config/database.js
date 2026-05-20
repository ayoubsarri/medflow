/**
 * DATABASE CONFIGURATION
 * This file handles the connection between the Node.js server and MongoDB Atlas
 * /**
 * WHY WE USE MONGOOSE:
 * 1. Schema Validation: Enforces a consistent structure for every document saved to the database.
 * 2. Data Casting: Automatically converts inputs (like strings to dates) to the correct data types.
 * 3. Simplified Queries: Provides readable methods like .find() instead of complex native driver code.
 * 4. Relationship Handling: Makes it easier to link different collections ex Patients and Appointments.
 */

const mongoose = require('mongoose');

// Load environment variables (like the connection string) from the .env file
require('dotenv').config(); 

const connectToDatabase = async () => {
    try {
        /**
         * Connect to MongoDB using the URI stored in the env file
         * We include 'tlsAllowInvalidCertificates' to prevent connection drops 
         *  caused by local network security restrictions or firewalls.
         */
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            tlsAllowInvalidCertificates: true 
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Working Database: ${conn.connection.name}`);

    } catch (error) {
        // If the connection fails, we log the error and terminate the process
        console.error(`❌ Database Connection Error: ${error.message}`);
        process.exit(1); 
    }
};

// Export the function to be initialized in server.js
module.exports = connectToDatabase;