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

describe('BatchExecutionService', () => {
  let service: BatchExecutionService;

  const mockTradeRepo = { batchCreate: mockBatchCreate } as any;
  const mockOrderRepo = { updateStatus: mockUpdateStatus } as any;
  const mockPubsub = { publish: mockPublish, subscribe: jest.fn() } as any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    service = new BatchExecutionService(mockTradeRepo, mockOrderRepo, mockPubsub);
    mockBatchCreate.mockResolvedValue([]);
    mockUpdateStatus.mockResolvedValue({});
    mockPublish.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function makeTradeResult(id: string): TradeResult {
    return {
      trade: {
        makerOrderId: `maker-${id}`,
        takerOrderId: `taker-${id}`,
        asset: 'BTC',
        price: 50000,
        quantity: 1,
      },
      makerOrder: {
        id: `maker-${id}`,
        userId: 'user-1',
        asset: 'BTC',
        side: OrderSide.MAKER,
        price: 50000,
        quantity: 1,
        remainingQuantity: 0,
        status: OrderStatus.MATCHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      takerOrder: {
        id: `taker-${id}`,
        userId: 'user-2',
        asset: 'BTC',
        side: OrderSide.TAKER,
        price: 50000,
        quantity: 1,
        remainingQuantity: 0,
        status: OrderStatus.MATCHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  it('should flush after the time window', async () => {
    service.addTrade(makeTradeResult('1'));
    service.addTrade(makeTradeResult('2'));

    expect(mockBatchCreate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockQuery).toHaveBeenCalledWith('BEGIN');
    expect(mockBatchCreate).toHaveBeenCalled();
  });

  it('should flush immediately when chunk size is reached', async () => {
    service.addTrade(makeTradeResult('1'));
    service.addTrade(makeTradeResult('2'));
    service.addTrade(makeTradeResult('3'));

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockBatchCreate).toHaveBeenCalled();
  });

  it('should group trades by asset', () => {
    const btcTrade = makeTradeResult('1');
    const ethTrade = makeTradeResult('2');
    ethTrade.trade.asset = 'ETH';
    ethTrade.makerOrder.asset = 'ETH';
    ethTrade.takerOrder.asset = 'ETH';

    service.addTrade(btcTrade);
    service.addTrade(ethTrade);

    // Both should be buffered separately - no flush yet since neither reached chunk size
    expect(mockBatchCreate).not.toHaveBeenCalled();
  });
});

// standardize API error format - revision 34

// defer metric collection until first request - revision 78

// correct WebSocket close code handling - revision 122

// extract WebSocket authentication flow - revision 166
