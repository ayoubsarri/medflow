/**
 * CITYMED BACKEND - MAIN ENTRY POINT
 */
require('dotenv').config(); 
const express = require('express');
const http = require('http'); 
const cors = require('cors');
const { Server } = require('socket.io'); 
const mongoose = require('mongoose');

// --- DATABASE & MODELS ---
const connectToDatabase = require('./config/database');
const Message = require('./models/Message'); 

const app = express();
const server = http.createServer(app); 

// --- MIDDLEWARE ---
// Reads allowed frontend URLs from .env
// To add a new URL, edit ALLOWED_ORIGINS in .env — no code change needed
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

// Private-network subnets (RFC 1918 + RFC 5737 loopback)
const PRIVATE_IP_RE = /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server or same-origin
    try {
      const hostname = new URL(origin).hostname;
      if (allowedOrigins.includes(origin) || PRIVATE_IP_RE.test(hostname)) {
        return callback(null, true);
      }
    } catch (_) { /* malformed origin — fall through to block */ }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

app.use(express.json());

// --- SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            try {
                const hostname = new URL(origin).hostname;
                if (allowedOrigins.includes(origin) || PRIVATE_IP_RE.test(hostname)) {
                    return callback(null, true);
                }
            } catch (_) { /* fall through */ }
            callback(new Error(`CORS blocked: ${origin}`));
        },
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected to chat:', socket.id);
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their private room`);
    });
    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, text, senderModel } = data;
        try {
            const newMessage = new Message({ senderId, senderModel, text });
            await newMessage.save();
            io.to(receiverId).emit('newMessage', { ...newMessage._doc, playChime: true });
        } catch (err) { console.error("Socket Message Error:", err); }
    });
});

// --- ROUTE MAPPING ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/receptionist', require('./routes/receptionistRoutes'));
app.use('/api/doctor', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));

// --- SERVER INITIALIZATION ---
async function startServer() {
    try {
        await connectToDatabase();
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`✅ MedFlow API & Real-time Server active on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Critical Startup Failure:', err.message);
        process.exit(1);
    }
}

startServer();