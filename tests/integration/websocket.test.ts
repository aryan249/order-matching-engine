import WebSocket from 'ws';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRY = '1h';

import { WsServer } from '../../src/websocket/wsServer';
import { generateToken } from '../../src/utils/jwt';
import { WsMessageType } from '../../src/types/ws';

jest.mock('../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

jest.mock('../../src/metrics/prometheus', () => ({
  metrics: {
    wsConnections: { inc: jest.fn(), dec: jest.fn() },
  },
}));

describe('WebSocket Server', () => {
  let wsServer: WsServer;
  const testPort = 9876;

  beforeAll(() => {
    wsServer = new WsServer(testPort);
  });

  afterAll(async () => {
    await wsServer.close();
  });

  function connectClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${testPort}`);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  }

