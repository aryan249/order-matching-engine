import { OrderSide, OrderStatus } from '../../../src/types/order';
import { TradeResult } from '../../../src/types/trade';

const mockBatchCreate = jest.fn();
const mockUpdateStatus = jest.fn();
const mockPublish = jest.fn();
const mockQuery = jest.fn();
const mockRelease = jest.fn();

jest.mock('../../../src/config/database', () => ({
  getClient: () =>
    Promise.resolve({
      query: mockQuery,
      release: mockRelease,
    }),
}));

jest.mock('../../../src/config/index', () => ({
  default: {
    batch: { windowMs: 500, chunkSize: 3 },
  },
  __esModule: true,
}));

jest.mock('../../../src/metrics/prometheus', () => ({
  metrics: {
    tradesExecuted: { inc: jest.fn() },
    batchesFlushed: { inc: jest.fn() },
    batchBufferSize: { set: jest.fn() },
    batchExecutionDuration: { startTimer: () => jest.fn() },
  },
}));

jest.mock('../../../src/config/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn() },
  __esModule: true,
}));

import { BatchExecutionService } from '../../../src/services/batchExecution';

