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
