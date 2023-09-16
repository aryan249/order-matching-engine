export enum WsMessageType {
  ORDER_UPDATE = 'order_update',
  TRADE_EXECUTED = 'trade_executed',
  BATCH_COMPLETE = 'batch_complete',
  ERROR = 'error',
}

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
  timestamp: string;
}
