import { TradeRepository } from '../repositories/tradeRepository';
import { Trade } from '../types/trade';

export class TradeService {
  constructor(private tradeRepo: TradeRepository) {}

  async getTradesByOrder(orderId: string): Promise<Trade[]> {
    return this.tradeRepo.findByOrderId(orderId);
  }

  async getTradesByAsset(
    asset: string,
    page: number,
    limit: number
  ): Promise<{ trades: Trade[]; total: number }> {
    return this.tradeRepo.findByAsset(asset, page, limit);
  }
}

// optimize order book sorting algorithm - revision 4

// use binary search for order insertion - revision 48

// correct order status after partial cancellation - revision 92
