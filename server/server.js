import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import passport from "./src/config/passport.js";
import http from "http";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from 'url';
import { Server } from "socket.io";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "../server/src/routes/auth.js";
import userRoutes from "../server/src/routes/users.js";
import serviceRoutes from "../server/src/routes/services.js";
import staffRoutes from "../server/src/routes/staff.js";
import slotRoutes from "../server/src/routes/slots.js";
import appointmentRoutes from "../server/src/routes/appointments.js";
import queueRoutes from "../server/src/routes/queue.js";
import paymentRoutes from "../server/src/routes/payment.js";
import notificationRoutes from "../server/src/routes/notifications.js";
import adminRoutes from "../server/src/routes/admin.js";
import chatRouter from './src/routes/chat.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
});


// Security, performance and rate limiting middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier development/deployment of this type of app
}));
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use("/api", limiter);

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/chat', chatRouter);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("MongoDB connection error:", err));

io.on('connection', (socket) => {
    console.log("New client connected:", socket.id);

    socket.on('join-queue', (queueId) => {
        socket.join(`queue-${queueId}`);
    });

    socket.on('queue:update', () => {
        socket.broadcast.emit('queue:update');
    });

    socket.on('disconnect', () => {
        console.log("Client disconnected:", socket.id);
    });
});

app.set('io', io);

app.use(session({
    secret: process.env.SESSION_SECRET || "your_secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV === 'production') {
    app.get('/', (req, res) => {
        res.send("API is running");
    });
}

app.use((err, req, res, next) => {
    console.error('❌ ERROR OCCURRED:');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Full Error:', err);
    res.status(500).json({
        message: "Something went wrong!",
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
}).on('error', (err) => {
    console.log("Server error:", err.message);
});
export { io };