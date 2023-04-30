import pool from '../config/database';
import { Order } from '../types/order';

export class OrderRepository {
    async create(order: Order): Promise<Order> {
        const result = await pool.query(
            'INSERT INTO orders (id, asset, side, type, price, quantity, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [order.id, order.asset, order.side, order.type, order.price, order.quantity, order.status]
        );
        return result.rows[0];
    }
}
