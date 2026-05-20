const sendNotification = require('../config/mailConfig');

const emailTemplates = {
    // Welcome Email (Request Received)
    welcome: (data) => ({
        subject: "Medical Appointment Request Received - Central Clinic",
        text: `Dear ${data.name},\n\nThank you for choosing Central Clinic. We have received your request for an appointment with ${data.doctorName} on ${data.date}.\n\nYour request is currently being processed by our administrative team. You will receive another email once your slot is confirmed.\n\nBest regards,\nCentral Clinic Administration`
    }),

    // Confirmation Email 
    confirmed: (data) => ({
        subject: "CONFIRMED: Your Appointment at Central Clinic",
        text: `Dear ${data.name},\n\nYour appointment has been officially confirmed!\n\n--- APPOINTMENT DETAILS ---\nDoctor: ${data.doctorName}\nDate: ${data.date}\nTime: ${data.time}\nClinic: Central Clinic - Main Branch\n\n--- YOUR PORTAL ACCESS ---\nTo access your medical history and prescriptions, please use your unique File Number at login:\nFILE NUMBER: ${data.fileCode}\n\nPlease arrive 10 minutes before your scheduled time.\n\nBest regards,\nCentral Clinic Team`
    }),

    // Cancellation Email
    cancelled: (data) => ({
        subject: "CANCELLATION NOTICE: Appointment at Central Clinic",
        text: `Dear ${data.name},\n\nThis email confirms that your appointment scheduled for ${data.date} has been cancelled.\n\nIf this was an error, please contact us immediately or book a new slot through our website.\n\nSincerely,\nCentral Clinic`
    })
};

const triggerEmail = async (type, recipientEmail, data) => {
    const template = emailTemplates[type](data);
    await sendNotification(recipientEmail, template.subject, template.text);
};

module.exports = triggerEmail;