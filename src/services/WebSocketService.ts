import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server;
  private clients: Map<string, Socket>;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    this.clients = new Map();
    
    this.io.on('connection', (socket) => {
      console.log('Client connected');
      
      socket.on('authenticate', (token: string) => {
        this.authenticateClient(socket, token);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        this.removeClientBySocket(socket);
      });
    });
  }

  public static getInstance(server?: HttpServer): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  public onConnection(callback: (socket: Socket) => void): void {
    this.io.on('connection', callback);
  }

  private authenticateClient(socket: Socket, token: string): void {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decoded.id;
      
      // Stocker le socket avec l'ID de l'utilisateur
      this.clients.set(userId, socket);

      // Envoyer une confirmation d'authentification
      socket.emit('auth_success', { userId });

    } catch (error) {
      console.error('Socket.IO authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  }

  private removeClientBySocket(socket: Socket): void {
    for (const [userId, clientSocket] of this.clients.entries()) {
      if (clientSocket === socket) {
        this.clients.delete(userId);
        break;
      }
    }
  }

  public removeClient(userId: string): void {
    if (this.clients.has(userId)) {
      const socket = this.clients.get(userId);
      if (socket) {
        socket.disconnect();
      }
      this.clients.delete(userId);
    }
  }

  public sendToUser(userId: string, type: string, data: any): void {
    const socket = this.clients.get(userId);
    if (socket && socket.connected) {
      socket.emit(type, data);
    }
  }

  public broadcastToAll(type: string, data: any): void {
    this.io.emit(type, data);
  }

  public closeAllConnections(): void {
    this.clients.forEach(socket => socket.disconnect());
    this.clients.clear();
    this.io.close();
  }
}

export default WebSocketService;
