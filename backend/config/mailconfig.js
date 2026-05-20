const nodemailer = require('nodemailer');

// Set up the "Transporter" (The engine that sends the email)
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use Gmail, Outlook, etc.
    auth: {
        user: process.env.EMAIL_USER, // Your clinic email
        pass: process.env.EMAIL_PASS  // Your App Password (not your regular password)
    }
});

/**
 * REUSABLE SEND FUNCTION
 
 */
const sendNotification = async (to, subject, text) => {
    const mailOptions = {
        from: '"Central Clinic" <noreply@centralclinic.com>',
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error("Email failed to send:", error);
    }
};

module.exports = sendNotification;