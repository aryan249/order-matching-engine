import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken } from '../utils/jwt';
import { WsMessage, WsMessageType } from '../types/ws';
import { metrics } from '../metrics/prometheus';
import logger from '../config/logger';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WsServer {
  private wss: WebSocketServer;
  private userConnections: Map<string, Set<AuthenticatedSocket>> = new Map();
  private assetSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: AuthenticatedSocket, _req: IncomingMessage) => {
      ws.isAlive = true;
      metrics.wsConnections.inc();

      const authTimeout = setTimeout(() => {
        if (!ws.userId) {
          ws.close(4001, 'Authentication timeout');
        }
      }, 5000);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message, authTimeout);
        } catch {
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        clearTimeout(authTimeout);
        this.removeConnection(ws);
        metrics.wsConnections.dec();
      });
    });

    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const socket = ws as AuthenticatedSocket;
        if (!socket.isAlive) {
          socket.terminate();
          return;
        }
        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);

    logger.info('WebSocket server started', { port });
  }

  private handleMessage(ws: AuthenticatedSocket, message: { type: string; token?: string; asset?: string }, authTimeout: NodeJS.Timeout): void {
    if (message.type === 'auth') {
      try {
        const payload = verifyToken(message.token || '');
        ws.userId = payload.userId;
        clearTimeout(authTimeout);

        const connections = this.userConnections.get(payload.userId) || new Set();
        connections.add(ws);
        this.userConnections.set(payload.userId, connections);

        ws.send(JSON.stringify({ type: 'auth_success', userId: payload.userId }));
        logger.info('WebSocket authenticated', { userId: payload.userId });
      } catch {
        this.sendError(ws, 'Authentication failed');
        ws.close(4002, 'Authentication failed');
      }
      return;
    }

    if (!ws.userId) {
      this.sendError(ws, 'Not authenticated');
      return;
    }

    if (message.type === 'subscribe' && message.asset) {
      const subscribers = this.assetSubscriptions.get(message.asset) || new Set();
      subscribers.add(ws.userId);
      this.assetSubscriptions.set(message.asset, subscribers);
      ws.send(JSON.stringify({ type: 'subscribed', asset: message.asset }));
    }

    if (message.type === 'unsubscribe' && message.asset) {
      const subscribers = this.assetSubscriptions.get(message.asset);
      if (subscribers) {
        subscribers.delete(ws.userId);
      }
    }
  }

  private removeConnection(ws: AuthenticatedSocket): void {
    if (ws.userId) {
      const connections = this.userConnections.get(ws.userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.userConnections.delete(ws.userId);
          this.assetSubscriptions.forEach((subscribers) => {
            subscribers.delete(ws.userId!);
          });
        }
      }
    }
  }

  sendToUser(userId: string, message: WsMessage): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      const data = JSON.stringify(message);
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    }
  }

  broadcastToAsset(asset: string, message: WsMessage): void {
    const subscribers = this.assetSubscriptions.get(asset);
    if (!subscribers) return;

    const data = JSON.stringify(message);
    subscribers.forEach((userId) => {
      const connections = this.userConnections.get(userId);
      if (connections) {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      }
    });
  }

  private sendError(ws: WebSocket, message: string): void {
    ws.send(JSON.stringify({ type: WsMessageType.ERROR, payload: { message }, timestamp: new Date().toISOString() }));
  }

  getConnectionCount(): number {
    return this.wss.clients.size;
  }

  async close(): Promise<void> {
    clearInterval(this.heartbeatInterval);
    return new Promise((resolve) => {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}

// consolidate config validation - revision 24

// pool JSON serializer instances - revision 68

// correct order book rebuild after restart - revision 112

// simplify order status update flow - revision 156
