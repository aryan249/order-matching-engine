import { Order, OrderSide, OrderType, OrderStatus } from '../types/order';

export class OrderMatchingService {
    private buyOrders: Order[] = [];
    private sellOrders: Order[] = [];

    addOrder(order: Order): void {
        if (order.side === OrderSide.BUY) {
            this.buyOrders.push(order);
            this.buyOrders.sort((a, b) => b.price - a.price);
        } else {
            this.sellOrders.push(order);
            this.sellOrders.sort((a, b) => a.price - b.price);
        }
    }
}
