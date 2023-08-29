import { OrderSide, OrderStatus, Order, CreateOrderDto } from '../../../src/types/order';

const mockCreate = jest.fn();
const mockEnqueue = jest.fn();
const mockPublish = jest.fn();

jest.mock('../../../src/metrics/prometheus', () => ({
  metrics: {
    ordersSubmitted: { inc: jest.fn() },
  },
}));

jest.mock('../../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

import { OrderIngestionService } from '../../../src/services/orderIngestion';

describe('OrderIngestionService', () => {
  let service: OrderIngestionService;
  const mockOrderRepo = { create: mockCreate } as any;
  const mockQueue = { enqueue: mockEnqueue } as any;
  const mockPubsub = { publish: mockPublish } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderIngestionService(mockOrderRepo, mockQueue, mockPubsub);
  });

  const makeMockOrder = (side: OrderSide): Order => ({
    id: 'order-1',
    userId: 'user-1',
    asset: 'BTC',
    side,
    price: 50000,
    quantity: 1,
    remainingQuantity: 1,
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('should create and enqueue a maker order', async () => {
    const order = makeMockOrder(OrderSide.MAKER);
    mockCreate.mockResolvedValue(order);
    mockEnqueue.mockResolvedValue(undefined);
    mockPublish.mockResolvedValue(undefined);

    const dto: CreateOrderDto = { asset: 'BTC', side: OrderSide.MAKER, price: 50000, quantity: 1 };
    const result = await service.ingest(dto, 'user-1');

    expect(result).toEqual(order);
    expect(mockCreate).toHaveBeenCalledWith({ ...dto, userId: 'user-1' });
    expect(mockEnqueue).toHaveBeenCalledWith('BTC', order);
    expect(mockPublish).toHaveBeenCalledWith('channel:order:new', order);
  });

  it('should create a taker order and publish for matching', async () => {
    const order = makeMockOrder(OrderSide.TAKER);
    mockCreate.mockResolvedValue(order);
    mockPublish.mockResolvedValue(undefined);

    const dto: CreateOrderDto = { asset: 'BTC', side: OrderSide.TAKER, price: 50000, quantity: 1 };
    const result = await service.ingest(dto, 'user-1');

    expect(result).toEqual(order);
    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalledWith('channel:order:new', order);
    expect(mockPublish).toHaveBeenCalledWith('channel:order:matched', order);
  });
});

// correct HTTP status codes for validation errors - revision 35
