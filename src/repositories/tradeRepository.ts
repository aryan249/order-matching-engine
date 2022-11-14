import pool from '../config/database';
import { Trade } from '../types/trade';

export class TradeRepository {
    async create(trade: Trade): Promise<Trade> {
        const result = await pool.query(
            'INSERT INTO trades (id, buy_order_id, sell_order_id, price, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [trade.id, trade.buyOrderId, trade.sellOrderId, trade.price, trade.quantity]
        );
        return result.rows[0];
    }
}
