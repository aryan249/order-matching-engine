import Redis from 'ioredis';
import { config } from '../config';

export class PubSub {
    private publisher: Redis;
    private subscriber: Redis;

    constructor() {
        this.publisher = new Redis(config.redisUrl);
        this.subscriber = new Redis(config.redisUrl);
    }
}
