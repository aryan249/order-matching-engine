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

  function waitForMessage(ws: WebSocket): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      ws.once('message', (data: Buffer) => {
        resolve(JSON.parse(data.toString()));
      });
    });
  }

  it('should authenticate a client with a valid JWT', async () => {
    const ws = await connectClient();
    const token = generateToken({ userId: 'user-1', email: 'test@test.com' });

    const msgPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'auth', token }));

    const response = await msgPromise;
    expect(response.type).toBe('auth_success');
    expect(response.userId).toBe('user-1');

    ws.close();
  });

  it('should reject authentication with an invalid token', async () => {
    const ws = await connectClient();

    const msgPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'auth', token: 'invalid-token' }));

    const response = await msgPromise;
    expect(response.type).toBe(WsMessageType.ERROR);

    await new Promise<void>((resolve) => {
      ws.on('close', () => resolve());
      setTimeout(resolve, 1000);
    });
  });

  it('should send messages to authenticated users', async () => {
    const ws = await connectClient();
    const token = generateToken({ userId: 'user-msg', email: 'msg@test.com' });

    const authPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'auth', token }));
    await authPromise;

    const msgPromise = waitForMessage(ws);
    wsServer.sendToUser('user-msg', {
      type: WsMessageType.ORDER_UPDATE,
      payload: { id: 'order-1' },
      timestamp: new Date().toISOString(),
    });

    const message = await msgPromise;
    expect(message.type).toBe(WsMessageType.ORDER_UPDATE);

    ws.close();
  });

  it('should handle asset subscriptions', async () => {
    const ws = await connectClient();
    const token = generateToken({ userId: 'user-sub', email: 'sub@test.com' });

    const authPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'auth', token }));
    await authPromise;

    const subPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'subscribe', asset: 'BTC' }));
    const subResponse = await subPromise;
    expect(subResponse.type).toBe('subscribed');

    const msgPromise = waitForMessage(ws);
    wsServer.broadcastToAsset('BTC', {
      type: WsMessageType.TRADE_EXECUTED,
      payload: { asset: 'BTC' },
      timestamp: new Date().toISOString(),
    });

    const message = await msgPromise;
    expect(message.type).toBe(WsMessageType.TRADE_EXECUTED);

    ws.close();
  });
});

// simplify service dependency injection - revision 44

// reduce lock contention in order book - revision 88

// correct Redis key expiration timing - revision 132
