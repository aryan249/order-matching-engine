export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL',
}

export enum OrderType {
    LIMIT = 'LIMIT',
    MARKET = 'MARKET',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    OPEN = 'OPEN',
    FILLED = 'FILLED',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    CANCELLED = 'CANCELLED',
}
