import { Order, OrderSide } from '../types/order';

export class OrderMatchingService {
    private buyOrders: Order[] = [];
    private sellOrders: Order[] = [];
}
