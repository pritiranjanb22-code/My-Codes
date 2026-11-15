import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import { setupWebSocket } from './websocket';
import authRoutes from './modules/auth/routes';
import tripRoutes from './modules/trips/routes';
import expenseRoutes from './modules/expenses/routes';
import vehicleRoutes from './modules/vehicles/routes';
import locationRoutes from './modules/location/routes';
import chatRoutes from './modules/chat/routes';
import emergencyRoutes from './modules/emergency/routes';
import notificationRoutes from './modules/notifications/routes';
import aiRoutes from './modules/ai/routes';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', authMiddleware, tripRoutes);
app.use('/api/expenses', authMiddleware, expenseRoutes);
app.use('/api/vehicles', authMiddleware, vehicleRoutes);
app.use('/api/location', authMiddleware, locationRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/emergency', authMiddleware, emergencyRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// WebSocket setup
setupWebSocket(io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = config.port || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚗 RoadTrip X Backend running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export { app, io };