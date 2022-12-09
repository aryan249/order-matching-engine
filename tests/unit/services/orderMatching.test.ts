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
    mockUpdateStatus.mockResolvedValue(taker);

    const results = await service.matchOrder(taker);

    expect(results).toHaveLength(1);
    expect(results[0].trade.quantity).toBe(1);
    expect(results[0].trade.price).toBe(50000);
    expect(mockRemoveOrder).toHaveBeenCalledWith('BTC', 'maker-1');
  });

  it('should partially match when taker quantity is less than maker', async () => {
    const maker = makeOrder({ id: 'maker-1', price: 50000, quantity: 10, remainingQuantity: 10 });
    const taker = makeOrder({ id: 'taker-1', side: OrderSide.TAKER, price: 50000, quantity: 3, remainingQuantity: 3 });

    mockPeek.mockResolvedValue([maker]);
    mockUpdateOrder.mockResolvedValue(undefined);
    mockUpdateStatus.mockResolvedValue(taker);

    const results = await service.matchOrder(taker);

    expect(results).toHaveLength(1);
    expect(results[0].trade.quantity).toBe(3);
    expect(mockUpdateOrder).toHaveBeenCalled();
    expect(mockRemoveOrder).not.toHaveBeenCalled();
  });

  it('should match multiple makers for a large taker order', async () => {
    const maker1 = makeOrder({ id: 'maker-1', price: 49000, remainingQuantity: 2 });
    const maker2 = makeOrder({ id: 'maker-2', price: 50000, remainingQuantity: 3 });
    const taker = makeOrder({ id: 'taker-1', side: OrderSide.TAKER, price: 50000, quantity: 4, remainingQuantity: 4 });

    mockPeek.mockResolvedValue([maker1, maker2]);
    mockRemoveOrder.mockResolvedValue(undefined);
    mockUpdateOrder.mockResolvedValue(undefined);
    mockUpdateStatus.mockImplementation((_id: string, _status: OrderStatus, remaining?: number) => {
      return Promise.resolve({ ...taker, remainingQuantity: remaining ?? 0 });
    });

    const results = await service.matchOrder(taker);

    expect(results).toHaveLength(2);
    expect(results[0].trade.quantity).toBe(2);
    expect(results[0].trade.price).toBe(49000);
    expect(results[1].trade.quantity).toBe(2);
    expect(results[1].trade.price).toBe(50000);
  });

  it('should not match when maker price exceeds taker price', async () => {
    const maker = makeOrder({ id: 'maker-1', price: 55000 });
    const taker = makeOrder({ id: 'taker-1', side: OrderSide.TAKER, price: 50000 });

    mockPeek.mockResolvedValue([maker]);

    const results = await service.matchOrder(taker);

    expect(results).toHaveLength(0);
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should prioritize cheaper makers first', async () => {
    const maker1 = makeOrder({ id: 'maker-1', price: 51000, remainingQuantity: 1 });
    const maker2 = makeOrder({ id: 'maker-2', price: 49000, remainingQuantity: 1 });
    const taker = makeOrder({ id: 'taker-1', side: OrderSide.TAKER, price: 52000, quantity: 1, remainingQuantity: 1 });

    mockPeek.mockResolvedValue([maker1, maker2]);
    mockRemoveOrder.mockResolvedValue(undefined);
    mockUpdateStatus.mockResolvedValue(taker);

    const results = await service.matchOrder(taker);

    expect(results).toHaveLength(1);
    expect(results[0].trade.price).toBe(49000);
  });
});

// lazy-load metric collectors - revision 33

// validate port number range in config - revision 77

// improve request validation pipeline - revision 121
