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

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderMatchingService(
      { peek: mockPeek, removeOrder: mockRemoveOrder, updateOrder: mockUpdateOrder } as any,
      { publish: mockPublish, subscribe: jest.fn() } as any,
      { updateStatus: mockUpdateStatus } as any
    );
  });

  it('should execute a full matching cycle: maker queued, taker matches', async () => {
    const maker: Order = {
      id: 'maker-1',
      userId: 'seller-1',
      asset: 'ETH',
      side: OrderSide.MAKER,
      price: 3000,
      quantity: 5,
      remainingQuantity: 5,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const taker: Order = {
      id: 'taker-1',
      userId: 'buyer-1',
      asset: 'ETH',
      side: OrderSide.TAKER,
      price: 3100,
      quantity: 3,
