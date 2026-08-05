# ShipBridge

A multi-courier integration platform. Exposes one unified REST API to internal
consumers (order management system, web frontend) and translates requests into
courier-specific calls behind a pluggable adapter layer. UrbaneBolt is the first
live integration; a MockCourier adapter demonstrates that new couriers can be
added without touching existing code.

## Tech stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Redis + BullMQ (async bulk processing)
- Axios (courier HTTP client, with auth-retry and backoff interceptors)
- Zod (request validation)

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or reachable via connection string)
- Redis running locally (or reachable via connection string)

## Setup

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd shipbridge
   npm install
   ```

2. **Create your `.env` file** in the project root (see [Environment variables](#environment-variables) below).

3. **Create the database** (if it doesn't already exist):

   ```bash
   psql -U postgres -c "CREATE DATABASE shipbridge;"
   ```

4. **Run migrations** — this creates all tables and generates the Prisma Client:

   ```bash
   npx prisma migrate dev
   ```

5. **Start Redis** (in its own terminal, or via a background service):

   ```bash
   redis-server
   ```

   Verify it's up:

   ```bash
   redis-cli ping
   # should return PONG
   ```

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://user@localhost:5432/shipbridge` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | API server port | `3000` |
| `URBANEBOLT_BASE_URL` | UrbaneBolt UAT base URL | `https://uat.urbanebolt.in` |
| `URBANEBOLT_USERNAME` | UrbaneBolt API username | — |
| `URBANEBOLT_PASSWORD` | UrbaneBolt API password | — |
| `URBANEBOLT_CUSTOMER_CODE` | UrbaneBolt customer code | `UEBCUS0008` |
| `URBANEBOLT_TIMEOUT_MS` | Request timeout for UrbaneBolt calls | `10000` |
| `URBANEBOLT_MAX_RETRIES` | Retry attempts for transient UrbaneBolt failures | `3` |

None of these are hardcoded in code — every courier's base URL, timeout, and
retry count is read from environment variables at adapter construction time.

## Running the app

The app runs as **two separate processes**: the API server, and a background
worker that processes bulk order jobs. Both must be running for bulk endpoints
to complete (single-order endpoints work with just the API server).

```bash
# terminal 1 — API server
npm run dev

# terminal 2 — bulk order worker
npm run worker

# terminal 3 — Redis, if not already running as a service
redis-server
```

The API listens on `http://localhost:3000` by default.

## Testing the endpoints

### Create an order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "courier_partner": "mockcourier",
    "clientOrderId": "test-order-001",
    "pickupAddress": { "name": "Sender", "phone": "9999999999", "addressLine": "123 Main St", "city": "Bhopal", "state": "MP", "pincode": "462001" },
    "deliveryAddress": { "name": "Receiver", "phone": "8888888888", "addressLine": "456 Oak Ave", "city": "Delhi", "state": "DL", "pincode": "110001" },
    "packageDetails": { "weightKg": 2, "declaredValue": 500 }
  }'
```

Swap `"courier_partner": "mockcourier"` for `"urbanebolt"` to hit the real
UAT API (requires serviceable pincodes — see Known limitations in DESIGN.md).

### Track a shipment

```bash
curl http://localhost:3000/api/v1/orders/{orderId}/track
```

### Cancel a shipment

```bash
curl -X POST http://localhost:3000/api/v1/orders/{orderId}/cancel
```

### Bulk create (up to 100 orders)

```bash
curl -X POST http://localhost:3000/api/v1/orders/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      { "courier_partner": "mockcourier", "clientOrderId": "bulk-001", "pickupAddress": {...}, "deliveryAddress": {...}, "packageDetails": {...} },
      { "courier_partner": "mockcourier", "clientOrderId": "bulk-002", "pickupAddress": {...}, "deliveryAddress": {...}, "packageDetails": {...} }
    ]
  }'
```

Returns immediately with a `batchId`. Check progress with:

```bash
curl http://localhost:3000/api/v1/orders/bulk/{batchId}
```

### Validation and error responses

Every error follows the same shape:

```json
{
  "error": {
    "code": "UNKNOWN_COURIER",
    "message": "Unknown courier_partner: \"fedex\"",
    "details": { "supported": ["mockcourier", "urbanebolt"] }
  }
}
```

Try an invalid courier or a missing field to see this in action:

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"courier_partner": "fedex", "clientOrderId": "x"}'
```

## How to add a new courier

Adding a courier never requires changing routes, controllers, DTOs, or
business logic in the services layer. Three steps:

1. **Implement the `CourierAdapter` interface** (`src/types/courier.types.ts`)
   in a new file under `src/services/couriers/<name>/`:

   ```ts
   export class NewCourierAdapter implements CourierAdapter {
     readonly code = "newcourier";
     async createOrder(input: NormalizedOrderInput): Promise<CreateOrderResult> { ... }
     async trackShipment(courierOrderId: string, awbNumber: string): Promise<TrackResult> { ... }
     async cancelOrder(courierOrderId: string, awbNumber?: string): Promise<CancelResult> { ... }
   }
   ```

   For a real courier, this typically means a `<name>.client.ts` (raw HTTP
   calls), a `<name>.mapper.ts` (translate between your normalized schema and
   the courier's schema), and a `<name>.adapter.ts` (glues the two together
   and implements the interface) — see `src/services/couriers/urbanebolt/`
   for a full example.

2. **Register it** in `src/services/couriers/registry.ts`:

   ```ts
   const registry = new Map<string, CourierAdapter>([
     ["mockcourier", new MockCourierAdapter()],
     ["urbanebolt", new UrbaneBoltAdapter()],
     ["newcourier", new NewCourierAdapter()], // ← add this line
   ]);
   ```

3. **Add its config to `.env`** (base URL, credentials, timeout, retry count).

Callers then just pass `"courier_partner": "newcourier"` in their existing
request shape — nothing else about the unified API changes.