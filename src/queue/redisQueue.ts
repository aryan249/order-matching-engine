import redis from '../config/redis';

export class RedisQueue {
    private queueName: string;

    constructor(queueName: string) {
        this.queueName = queueName;
    }

    async enqueue(data: any): Promise<void> {
        await redis.lpush(this.queueName, JSON.stringify(data));
    }
}
