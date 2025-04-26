import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Interface pour les événements personnalisés
interface ServerToClientEvents {
  notification: (data: any) => void;
  appointmentUpdate: (data: { appointmentId: string; status: string }) => void;
}

interface ClientToServerEvents {
  authenticate: (token: string) => void;
  subscribeToAppointments: () => void;
  unsubscribeFromAppointments: () => void;
}

interface SocketData {
  user?: IUser;
}

export const initializeWebSocket = (server: HttpServer): Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5000',
      methods: ['GET', 'POST', "PUT", "DELETE", "PATCH"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 30000
    }
  });

  // Middleware d'authentification
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      socket.data.user = { _id: decoded.id } as IUser;
      console.log(`User authenticated: ${socket.data.user._id}`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) => {
    console.log('Client connected:', socket.id);

    // Joindre l'utilisateur à sa chambre personnelle
    if (socket.data.user?._id) {
      const userId = socket.data.user._id.toString();
      socket.join(userId);
      console.log(`User ${userId} joined personal room`);
      socket.emit('notification', { 
        type: 'success', 
        message: 'Connecté au service de notifications' 
      });
    }

    socket.on('authenticate', (token: string) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        socket.data.user = { _id: decoded.id } as IUser;
        
        // Rejoindre la chambre personnelle après authentification manuelle
        const userId = decoded.id;
        socket.join(userId);
        console.log(`User ${userId} joined personal room after manual auth`);
        
        socket.emit('notification', { 
          type: 'success', 
          message: 'Authentification réussie' 
        });
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('notification', { 
          type: 'error', 
          message: 'Échec de l\'authentification' 
        });
      }
    });

    socket.on('subscribeToAppointments', () => {
      if (socket.data.user) {
        socket.join(`user:${socket.data.user._id}:appointments`);
      }
    });

    socket.on('unsubscribeFromAppointments', () => {
      if (socket.data.user) {
        socket.leave(`user:${socket.data.user._id}:appointments`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

export default initializeWebSocket;