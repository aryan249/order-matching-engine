import { query, getClient } from '../config/database';
import { Order, OrderStatus, CreateOrderDto } from '../types/order';

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    asset: row.asset as string,
    side: row.side as Order['side'],
    price: parseFloat(row.price as string),
    quantity: parseFloat(row.quantity as string),
    remainingQuantity: parseFloat(row.remaining_quantity as string),
    status: row.status as OrderStatus,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export class OrderRepository {
  async create(dto: CreateOrderDto & { userId: string }): Promise<Order> {
    const result = await query(
      `INSERT INTO orders (user_id, asset, side, price, quantity, remaining_quantity, status)
       VALUES ($1, $2, $3, $4, $5, $5, 'pending')
       RETURNING *`,
      [dto.userId, dto.asset, dto.side, dto.price, dto.quantity]
    );
    return rowToOrder(result.rows[0]);
  }

  async findById(id: string): Promise<Order | null> {
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows.length > 0 ? rowToOrder(result.rows[0]) : null;
  }

  async findByAssetAndStatus(asset: string, status: OrderStatus): Promise<Order[]> {
    const result = await query(
      'SELECT * FROM orders WHERE asset = $1 AND status = $2 ORDER BY price ASC, created_at ASC',
      [asset, status]
    );
    return result.rows.map(rowToOrder);
  }

  async updateStatus(id: string, status: OrderStatus, remainingQuantity?: number): Promise<Order> {
    const client = await getClient();
    try {
      const fields = ['status = $2', 'updated_at = NOW()'];
      const params: unknown[] = [id, status];

      if (remainingQuantity !== undefined) {
        fields.push(`remaining_quantity = $${params.length + 1}`);
