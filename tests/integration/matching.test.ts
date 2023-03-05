import { OrderSide, OrderStatus, Order } from '../../src/types/order';

const mockPeek = jest.fn();
const mockRemoveOrder = jest.fn();
const mockUpdateOrder = jest.fn();
const mockUpdateStatus = jest.fn();
const mockPublish = jest.fn();

jest.mock('../../src/config/redis', () => ({
  getRedisClient: () => ({}),
  createRedisClient: () => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    quit: jest.fn(),
  }),
}));

jest.mock('../../src/metrics/prometheus', () => ({
  metrics: {
    ordersMatched: { inc: jest.fn() },
    matchingDuration: { startTimer: () => jest.fn() },
  },
}));

jest.mock('../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

import { OrderMatchingService } from '../../src/services/orderMatching';

describe('Order Matching Integration', () => {
  let service: OrderMatchingService;

