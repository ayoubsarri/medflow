const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderModel: { type: String, enum: ['Doctor', 'Receptionist'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['sent', 'read'], default: 'sent' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);