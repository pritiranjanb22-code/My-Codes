import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tripId?: string;
}

const connectedUsers = new Map<string, Set<string>>(); // tripId -> Set of socketIds
const userLocations = new Map<string, any>(); // socketId -> location

export const setupWebSocket = (io: SocketIOServer) => {
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwtSecret) as {
        id: string;
        email: string;
      };

      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // Join trip room
    socket.on('join_trip', (tripId: string) => {
      socket.join(`trip:${tripId}`);
      socket.tripId = tripId;
      
      if (!connectedUsers.has(tripId)) {
        connectedUsers.set(tripId, new Set());
      }
      connectedUsers.get(tripId)!.add(socket.id);
      
      // Notify others in trip
      socket.to(`trip:${tripId}`).emit('member_joined', {
        userId: socket.userId,
        socketId: socket.id,
      });
    });

    // Leave trip room
    socket.on('leave_trip', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
      connectedUsers.get(tripId)?.delete(socket.id);
      
      socket.to(`trip:${tripId}`).emit('member_left', {
        userId: socket.userId,
      });
    });

    // Location updates
    socket.on('location_update', (data: {
      tripId: string;
      latitude: number;
      longitude: number;
      accuracy: number;
      speed?: number;
      heading?: number;
      altitude?: number;
      batteryLevel?: number;
    }) => {
      if (!socket.tripId || socket.tripId !== data.tripId) return;
      
      userLocations.set(socket.id, {
        userId: socket.userId,
        ...data,
        timestamp: Date.now(),
      });

      // Broadcast to trip members (throttled)
      socket.to(`trip:${data.tripId}`).emit('location_updated', {
        userId: socket.userId,
        ...data,
      });
    });

    // Chat messages
    socket.on('chat_message', (data: {
      tripId: string;
      message: any;
    }) => {
      if (!socket.tripId || socket.tripId !== data.tripId) return;
      
      io.to(`trip:${data.tripId}`).emit('message_received', data.message);
    });

    // Typing indicators
    socket.on('typing_start', (tripId: string) => {
      socket.to(`trip:${tripId}`).emit('user_typing', {
        userId: socket.userId,
      });
    });

    socket.on('typing_stop', (tripId: string) => {
      socket.to(`trip:${tripId}`).emit('user_stopped_typing', {
        userId: socket.userId,
      });
    });

    // Emergency alerts
    socket.on('emergency_triggered', (data: {
      tripId: string;
      emergency: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('emergency_alert', data.emergency);
    });

    // Expense updates
    socket.on('expense_created', (data: {
      tripId: string;
      expense: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('expense_added', data.expense);
    });

    socket.on('expense_updated', (data: {
      tripId: string;
      expense: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('expense_updated', data.expense);
    });

    // Settlement updates
    socket.on('settlement_created', (data: {
      tripId: string;
      settlement: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('settlement_added', data.settlement);
    });

    // Vehicle updates
    socket.on('vehicle_updated', (data: {
      tripId: string;
      vehicle: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('vehicle_updated', data.vehicle);
    });

    // Poll updates
    socket.on('poll_created', (data: {
      tripId: string;
      poll: any;
    }) => {
      io.to(`trip:${data.tripId}`).emit('poll_added', data.poll);
    });

    socket.on('poll_vote', (data: {
      tripId: string;
      pollId: string;
      optionId: string;
      userId: string;
    }) => {
      io.to(`trip:${data.tripId}`).emit('poll_voted', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.id})`);
      
      if (socket.tripId) {
        connectedUsers.get(socket.tripId)?.delete(socket.id);
        socket.to(`trip:${socket.tripId}`).emit('member_left', {
          userId: socket.userId,
        });
      }
      
      userLocations.delete(socket.id);
    });
  });

  // Periodic location broadcast for convoy mode
  setInterval(() => {
    connectedUsers.forEach((sockets, tripId) => {
      const locations: any[] = [];
      sockets.forEach(socketId => {
        const loc = userLocations.get(socketId);
        if (loc) locations.push(loc);
      });
      
      if (locations.length > 0) {
        io.to(`trip:${tripId}`).emit('convoy_locations', locations);
      }
    });
  }, 10000); // Every 10 seconds
};

export const getConnectedUsers = (tripId: string): string[] => {
  return Array.from(connectedUsers.get(tripId) || []);
};

export const getUserLocation = (socketId: string) => {
  return userLocations.get(socketId);
};