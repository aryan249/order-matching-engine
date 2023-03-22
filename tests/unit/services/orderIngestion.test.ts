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
