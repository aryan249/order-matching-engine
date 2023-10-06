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
