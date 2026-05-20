/* 
   This controller handles the retrieval and status management of 
   in-app messages between the Doctor and Receptionist.
*/
const Message = require('../models/Message');

// Fetches the full chat history
exports.getChatHistory = async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to load messages" });
    }
};

// Updates 'sent' to 'read' (The blue double-check logic)
exports.markAsRead = async (req, res) => {
    try {
        const { senderId } = req.body;
        await Message.updateMany(
            { senderId: senderId, status: 'sent' }, 
            { status: 'read' }
        );
        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};