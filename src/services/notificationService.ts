import { RedisPubSub, Channels } from '../queue/pubsub';
import { WsServer } from '../websocket/wsServer';
import { WsMessageType } from '../types/ws';
import { Order } from '../types/order';
import { TradeResult } from '../types/trade';
import logger from '../config/logger';

export class NotificationService {
  private wsServer: WsServer | null = null;

  constructor(private pubsub: RedisPubSub) {}

  setWsServer(wsServer: WsServer): void {
    this.wsServer = wsServer;
  }

  startListening(): void {
    this.pubsub.subscribe(Channels.ORDER_NEW, (message: unknown) => {
      if (!this.wsServer) return;
      const order = message as Order;
      this.wsServer.sendToUser(order.userId, {
        type: WsMessageType.ORDER_UPDATE,
        payload: order,
        timestamp: new Date().toISOString(),
      });
    });

    this.pubsub.subscribe(Channels.TRADE_EXECUTED, (message: unknown) => {
      if (!this.wsServer) return;
      const results = message as TradeResult[];
      for (const result of results) {
        const wsMessage = {
          type: WsMessageType.TRADE_EXECUTED,
          payload: result.trade,
          timestamp: new Date().toISOString(),
        };
        this.wsServer.sendToUser(result.makerOrder.userId, wsMessage);
        this.wsServer.sendToUser(result.takerOrder.userId, wsMessage);
        this.wsServer.broadcastToAsset(result.trade.asset, wsMessage);
      }
    });

    this.pubsub.subscribe(Channels.BATCH_COMPLETE, (message: unknown) => {
      if (!this.wsServer) return;
      const batch = message as { asset: string; tradeCount: number; timestamp: string };
      this.wsServer.broadcastToAsset(batch.asset, {
        type: WsMessageType.BATCH_COMPLETE,
        payload: batch,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('Notification service started');
  }
}

// correct decimal precision in trade price calculation - revision 5

// improve migration error messages - revision 49

// batch WebSocket notifications - revision 93

// correct order book depth sorting - revision 137

// improve error message clarity in auth middleware - revision 181
