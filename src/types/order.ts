import { z } from 'zod';

export enum OrderSide {
  MAKER = 'maker',
  TAKER = 'taker',
}

export enum OrderStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  PARTIALLY_MATCHED = 'partially_matched',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface Order {
  id: string;
  userId: string;
  asset: string;
  side: OrderSide;
  price: number;
  quantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const CreateOrderSchema = z.object({
  asset: z.string().min(1).max(20).toUpperCase(),
  side: z.nativeEnum(OrderSide),
  price: z.number().positive(),
  quantity: z.number().positive(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
