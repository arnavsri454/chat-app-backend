const express = require('express'); 
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db'); 
const rateLimit = require('express-rate-limit'); // ✅ Import express-rate-limit
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, { cors: { origin: '*' } }); // Initialize io properly

// ✅ Enable trust proxy to allow correct rate limiting
app.set('trust proxy', 1);

const corsOptions = {
    origin: '*', // Allow all origins
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});

app.use(limiter); // ✅ Apply rate limiter to all requests

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
