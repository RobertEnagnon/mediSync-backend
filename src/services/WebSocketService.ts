import WebSocket from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocket>;

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
  }

  public static getInstance(server?: Server): WebSocketService {
    if (!WebSocketService.instance && server) {
      WebSocketService.instance = new WebSocketService(server);
    }
    return WebSocketService.instance;
  }

  public onConnection(callback: (socket: WebSocket) => void): void {
    this.wss.on('connection', callback);
  }

  public authenticateClient(socket: WebSocket, token: string): void {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decoded.id;
      
      // Stocker le socket avec l'ID de l'utilisateur
      this.clients.set(userId, socket);

      // Écouter la déconnexion
      socket.on('close', () => {
        this.removeClient(userId);
      });

      // Envoyer une confirmation d'authentification
      socket.send(JSON.stringify({ 
        type: 'auth_success',
        data: { userId }
      }));

    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.send(JSON.stringify({ 
        type: 'auth_error',
        data: { message: 'Authentication failed' }
      }));
      socket.close();
    }
  }

  public removeClient(userId: string): void {
    if (this.clients.has(userId)) {
      const socket = this.clients.get(userId);
      if (socket) {
        socket.close();
      }
      this.clients.delete(userId);
    }
  }

  public sendToUser(userId: string, type: string, data: any): void {
    const socket = this.clients.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    }
  }

  public broadcastToAll(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    this.clients.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }

  public closeAllConnections(): void {
    this.clients.forEach(socket => socket.close());
    this.clients.clear();
  }
}

export default WebSocketService;
