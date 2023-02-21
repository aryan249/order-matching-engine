import { OrderSide, OrderStatus, Order } from '../../../src/types/order';

const mockPeek = jest.fn();
const mockRemoveOrder = jest.fn();
const mockUpdateOrder = jest.fn();
const mockPublish = jest.fn();
const mockUpdateStatus = jest.fn();

jest.mock('../../../src/metrics/prometheus', () => ({
  metrics: {
    ordersMatched: { inc: jest.fn() },
    matchingDuration: { startTimer: () => jest.fn() },
  },
}));

jest.mock('../../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

import { OrderMatchingService } from '../../../src/services/orderMatching';

describe('OrderMatchingService', () => {
  let service: OrderMatchingService;

  const mockQueue = {
    peek: mockPeek,
    removeOrder: mockRemoveOrder,
    updateOrder: mockUpdateOrder,
  } as any;
  const mockPubsub = { publish: mockPublish, subscribe: jest.fn() } as any;
  const mockOrderRepo = { updateStatus: mockUpdateStatus } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderMatchingService(mockQueue, mockPubsub, mockOrderRepo);
  });

  function makeOrder(overrides: Partial<Order> = {}): Order {
    return {
      id: 'order-1',
      userId: 'user-1',
      asset: 'BTC',
      side: OrderSide.MAKER,
      price: 50000,
      quantity: 1,
      remainingQuantity: 1,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  it('should match a taker with a single maker at equal price', async () => {
    const maker = makeOrder({ id: 'maker-1', side: OrderSide.MAKER, price: 50000 });
    const taker = makeOrder({ id: 'taker-1', side: OrderSide.TAKER, price: 50000, userId: 'user-2' });

    mockPeek.mockResolvedValue([maker]);
    mockRemoveOrder.mockResolvedValue(undefined);
