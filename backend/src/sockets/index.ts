import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import Volunteer from '../modules/volunteers/volunteer.model.js';

let io: Server;

/**
 * Initialize Socket.io with JWT auth guard.
 * All socket connections require a valid access token.
 */
export function initializeSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(','),
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth middleware — validate JWT before allowing connection ──────
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.debug(`Socket connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // ── Volunteer goes online ──────────────────────────────────────
    socket.on('volunteerOnline', async () => {
      try {
        const volunteer = await Volunteer.findOneAndUpdate(
          { userId },
          { activeStatus: 'online' },
          { new: true },
        );
        if (volunteer) {
          socket.join('volunteers');
          socket.join(`volunteer:${volunteer._id.toString()}`);
          io.to('volunteers').emit('volunteerStatusChanged', {
            volunteerId: volunteer._id,
            status: 'online',
          });
        }
      } catch (err) {
        logger.error('Error updating volunteer status', err);
      }
    });

    // ── Location update (for women safety tracking) ────────────────
    socket.on('locationUpdate', (data: { latitude: number; longitude: number }) => {
      // Broadcast to all connected users (for women safety feature)
      io.emit('userLocationUpdate', {
        userId,
        location: data,
        timestamp: new Date(),
      });
    });

    // ── Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.debug(`Socket disconnected: ${userId}`);
      try {
        const volunteer = await Volunteer.findOneAndUpdate(
          { userId },
          { activeStatus: 'offline' },
          { new: true },
        );
        if (volunteer) {
          io.to('volunteers').emit('volunteerStatusChanged', {
            volunteerId: volunteer._id,
            status: 'offline',
          });
        }
      } catch (err) {
        logger.error('Error on socket disconnect', err);
      }
    });
  });

  logger.info('✅ Socket.io initialized with JWT auth guard');
  return io;
}

/**
 * Get the initialized Socket.io instance.
 * Use this in controllers/services to emit events.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized — call initializeSocketIO first');
  }
  return io;
}

/**
 * Emit event helpers for use in services/controllers.
 */
export const socketEvents = {
  /** Notify nearby volunteers about a new help request */
  helpRequestCreated(request: any) {
    getIO().to('volunteers').emit('helpRequestCreated', request);
  },

  /** Notify the requester that their request was accepted */
  helpRequestAccepted(requesterId: string, request: any) {
    getIO().to(`user:${requesterId}`).emit('helpRequestAccepted', request);
  },

  /** Broadcast instant help alert to ALL connected users */
  instantHelp(alert: any) {
    getIO().emit('instantHelp', alert);
  },

  /** Notify specific user */
  notifyUser(userId: string, event: string, data: any) {
    getIO().to(`user:${userId}`).emit(event, data);
  },
};
