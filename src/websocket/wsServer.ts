import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

export class WsServer {
    private wss: WebSocketServer;

    constructor(server: http.Server) {
        this.wss = new WebSocketServer({ server });
    }

    start(): void {
        this.wss.on('connection', (ws: WebSocket) => {
            console.log('Client connected');
            ws.on('close', () => console.log('Client disconnected'));
        });
    }
}
