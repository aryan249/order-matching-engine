# Order Matching Engine

Production-grade order matching engine in TypeScript with maker/taker classification, Redis pub-sub architecture, batch execution, and real-time WebSocket updates.

## Architecture

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────��┐
│  REST API │───▶│    Order     │───▶│    Order     │──��▶│    Batch     │───▶│  WebSocket   │
│  Server   │    │  Ingestion   │    │   Matching   │    │  Execution   │    │ Notification │
└─────┬────┘    └──────┬───────┘    └──────┬───────┘    ��──────┬─────��─┘    └─────���┬───────┘
      │                │                   │                   │                   │
      │                └───────────────────┴───────────────────┴────────��──────────┘
      │                                    │
      │                          ┌───��─────┴─────────┐
      │                          │    Redis           ���
      │                          │  Queue / PubSub /  │
      │                          │  Cache / RateLimit │
      │                          └───────────────────┘
      │
      │                          ┌───────────────────┐
      └─────────────────────────▶│   PostgreSQL      │
                                 │  Persistent Store  │
                                 └───────────────────┘
```

### Data Flow

1. **API Server** — Express REST API with JWT auth, rate limiting, and response caching
2. **Order Ingestion** — Validates orders, persists to PostgreSQL, enqueues makers to Redis, publishes events
3. **Order Matching** — Listens for taker orders via pub/sub, matches against queued makers by price priority
4. **Batch Execution** — Buffers matched trades, flushes every 500ms or at 50 trades (whichever comes first)
5. **WebSocket Notification** — Pushes real-time order/trade updates to connected clients

All components communicate via Redis pub/sub channels, enabling horizontal scaling.

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **One Redis queue per asset** | Partition parallelism — assets matched independently without contention |
| **Takers skip the queue** | Sell-side liquidity (makers) waits; buy-side demand (takers) triggers immediate matching |
| **Batch execution with dual threshold** | 500ms window caps latency; chunk size 50 amortizes DB writes under load |
| **Redis pub/sub event bus** | Decouples all 5 components — each can run as a separate process/server |
| **Sliding window rate limiting** | Redis INCR + EXPIRE provides fair, distributed rate limiting |
| **JWT over API keys** | Stateless auth with configurable expiry, no server-side session storage |
| **Optimistic concurrency** | Order status updates check `updated_at` to prevent lost updates across servers |

## Tech Stack

- **Runtime**: Node.js 20+, TypeScript 5
- **HTTP**: Express with Helmet, CORS
- **Database**: PostgreSQL 15 (pg driver)
- **Cache/Queue**: Redis 7 (ioredis)
- **WebSocket**: ws
- **Auth**: jsonwebtoken + bcrypt
- **Validation**: Zod
- **Metrics**: prom-client (Prometheus)
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js >= 20
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd order-matching-engine
npm install

# Start infrastructure
docker-compose up -d redis postgres

# Configure environment
cp .env.example .env

# Run migrations
npm run migrate

# Start development server
npm run dev
```

The HTTP server starts on port 3000 and WebSocket on port 3001.

## API Reference

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "securepassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "securepassword123"
}
```

### Orders

All order endpoints require `Authorization: Bearer <token>` header.

#### Submit Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "asset": "BTC",
  "side": "maker",
  "price": 50000,
  "quantity": 1.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| asset | string | Asset symbol (e.g., BTC, ETH) |
| side | string | `maker` (sell) or `taker` (buy) |
| price | number | Order price (must be > 0) |
| quantity | number | Order quantity (must be > 0) |

#### List Orders
```http
GET /orders?page=1&limit=20
Authorization: Bearer <token>
