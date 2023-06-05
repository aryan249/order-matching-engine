import { Order } from './order';

export interface Trade {
  id: string;
  makerOrderId: string;
  takerOrderId: string;
  asset: string;
  price: number;
  quantity: number;
  executedAt: Date;
}

export interface TradeResult {
  trade: Omit<Trade, 'id' | 'executedAt'>;
  makerOrder: Order;
  takerOrder: Order;
}

// improve cache key generation strategy - revision 31

// handle empty batch flush correctly - revision 75

// simplify health check endpoint - revision 119

// reduce latency in order acknowledgment - revision 163
