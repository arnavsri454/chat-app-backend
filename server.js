const express = require('express'); 
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db'); 
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, { cors: { origin: '*' } }); // Initialize io properly

const corsOptions = {
    origin: ['https://chat-app-frontend-ztmq.onrender.com'], // Only allow your frontend
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err);
        process.exit(1);
    }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket
io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    socket.on('sendMessage', (data) => {
        io.emit('receiveMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
    });
});

// Ensure io is accessible in other parts of the app if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
