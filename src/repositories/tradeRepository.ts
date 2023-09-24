import { query } from '../config/database';
import { Trade } from '../types/trade';

function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: row.id as string,
    makerOrderId: row.maker_order_id as string,
    takerOrderId: row.taker_order_id as string,
    asset: row.asset as string,
    price: parseFloat(row.price as string),
    quantity: parseFloat(row.quantity as string),
    executedAt: new Date(row.executed_at as string),
  };
}

export class TradeRepository {
  async create(trade: Omit<Trade, 'id' | 'executedAt'>): Promise<Trade> {
    const result = await query(
      `INSERT INTO trades (maker_order_id, taker_order_id, asset, price, quantity)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [trade.makerOrderId, trade.takerOrderId, trade.asset, trade.price, trade.quantity]
    );
    return rowToTrade(result.rows[0]);
  }

  async findByOrderId(orderId: string): Promise<Trade[]> {
    const result = await query(
      'SELECT * FROM trades WHERE maker_order_id = $1 OR taker_order_id = $1 ORDER BY executed_at DESC',
      [orderId]
    );
    return result.rows.map(rowToTrade);
  }

  async findByAsset(asset: string, page: number, limit: number): Promise<{ trades: Trade[]; total: number }> {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      query('SELECT * FROM trades WHERE asset = $1 ORDER BY executed_at DESC LIMIT $2 OFFSET $3', [
        asset,
        limit,
        offset,
