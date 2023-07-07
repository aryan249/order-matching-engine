import { Order } from '../types/order';

export class BatchExecutionService {
    private batch: Order[] = [];
    private batchSize: number;

    constructor(batchSize: number = 100) {
        this.batchSize = batchSize;
    }

    addToBatch(order: Order): void {
        this.batch.push(order);
    }
}
