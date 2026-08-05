# ShipBridge — Design Document

## Architecture overview

ShipBridge is a layered Express/TypeScript service sitting between internal
consumers (order management system, web frontend) and multiple courier
partners. Consumers speak one courier-agnostic API; the system translates and
routes each request to the correct courier behind the scenes.

```
Request
  → Routes            (URL → controller mapping only)
  → Middleware         (validation, then business logic)
  → Controllers        (parse request, call service, shape response)
  → Services           (business logic: idempotency, persistence, orchestration)
  → Courier Registry    (looks up the right adapter by courier_partner string)
  → Courier Adapter     (implements a fixed interface; one per courier)
  → Courier Client       (raw HTTP calls to that courier's API)
  → Prisma / Postgres  (persistence, at every layer that needs it)
```

Each layer only knows about the layer directly below it. Controllers never
touch Prisma directly; adapters never know about Express; the registry never
knows what a specific courier's request shape looks like.

## Design pattern: Adapter (Strategy-like)

The core requirement — "adding a courier must not require changing
controllers, DTOs, or business logic" — is solved with the **Adapter
pattern**. `CourierAdapter` is a fixed TypeScript interface:

```ts
interface CourierAdapter {
  readonly code: string;
  createOrder(input: NormalizedOrderInput): Promise<CreateOrderResult>;
  trackShipment(courierOrderId: string, awbNumber: string): Promise<TrackResult>;
  cancelOrder(courierOrderId: string, awbNumber?: string): Promise<CancelResult>;
}
```

Every courier — `MockCourierAdapter`, `UrbaneBoltAdapter`, and any future
courier — implements this same interface. A `Map<string, CourierAdapter>`
registry (`registry.ts`) resolves the `courier_partner` string from each
request to the correct instance. The service layer (`order.service.ts`) only
ever calls `adapter.createOrder(...)`, `adapter.trackShipment(...)`, etc. —
it has no idea whether it's talking to a fake courier or a real one.

This was chosen over alternatives like a single "god service" with
if/else-per-courier branching, because:
- New couriers are additive (one new file + one registry line), not
  invasive — existing, tested code paths are never touched or re-tested.
- Courier-specific quirks (UrbaneBolt's field names, its embedded
  success/error response shape, its own status codes) stay fully contained
  inside that courier's own files (`urbanebolt.client.ts`,
  `urbanebolt.mapper.ts`), never leaking into shared code.
- It made the required MockCourier "bonus" adapter almost free — it's
  proof, not just a demo, that the interface boundary actually holds.

Within each courier's folder there's a secondary split worth naming: the
**client** (raw HTTP/auth) is separate from the **mapper** (schema
translation) is separate from the **adapter** (glues them and satisfies the
interface). This kept UrbaneBolt's real UAT quirks (odd field names,
`errorResponse`/`successResponse` embedded in a 200 response, `PPD`/`COD`
enum values instead of full words) from ever touching the unified schema.

## Database schema

Four tables, all in `prisma/schema.prisma`:

**`orders`** — one row per shipment. Stores the caller's idempotency key
(`clientOrderId`, unique), which courier handled it, the courier's own order
ID and AWB number, current status, and full request/response JSON snapshots
from the courier call (for audit/debugging per the assignment's requirement).

**`tracking_events`** — append-only. One row per tracking poll, storing the
normalized status, the courier's raw response, and a timestamp. `orders`
holds only the *current* status; this table holds the full history, as
required. Never updated in place, only inserted into.

**`bulk_batches`** — one row per bulk request, tracking total order count.

**`bulk_batch_items`** — one row per order within a batch. Holds the
caller's normalized payload (parked here until an `Order` row exists),
which courier it targets, and its own success/failure status with an error
message if it failed. `@@unique([batchId, clientOrderId])` makes bulk
submission idempotent per batch; `Order.clientOrderId` being globally unique
makes single-order creation idempotent regardless of how it's triggered
(direct API call or bulk worker).

Courier identity is stored as a plain string (`courier_partner`) rather than
a database enum or foreign key to a `CourierConfig` table. This was a
deliberate trade-off (see below) — it means adding a courier never requires
a migration, at the cost of no database-level referential integrity on that
field (enforced instead by the adapter registry throwing `UnknownCourierError`
at request time).

## Bulk processing

`POST /orders/bulk` returns a `202 Accepted` with a `batchId` immediately,
rather than blocking on up to 100 courier calls in one HTTP request. Actual
processing happens via **BullMQ** (Redis-backed job queue): one job is
enqueued per order, and a separate worker process (`src/worker.ts`, run
independently of the API server) consumes jobs at a configured concurrency
(10 in parallel), rather than 100 sequential courier calls.

Trade-off made explicitly here: **batch status is computed on read**
(`GET /orders/bulk/:batchId` runs a `COUNT... GROUP BY status` over
`bulk_batch_items` each time it's called) rather than maintained as a
running counter on `bulk_batches`. This avoids any risk of race conditions
from concurrent jobs incrementing a shared counter, at the cost of a
slightly more expensive read — an acceptable trade for a status-check
endpoint that isn't called at high frequency.

Idempotency at the bulk level is enforced two ways: a BullMQ `jobId` built
from `batchId + clientOrderId` deduplicates at the queue level (a resubmit
of the same batch won't re-enqueue already-queued jobs), and the
`Order.clientOrderId` unique constraint is the actual correctness guarantee
underneath that (queue-level dedup only holds while a job is still in
Redis).

## Error handling

A single normalized error shape (`{ error: { code, message, details } }`)
is produced by one Express error-handling middleware, fed by a small
hierarchy of custom error classes (`AppError` base, with
`UnknownCourierError`, `ValidationError`, etc. extending it). Every
deliberately-thrown error carries its own HTTP status code and machine-
readable `code`; anything unexpected falls through to a generic `500`
without leaking internal detail (stack traces, connection strings) to the
client — those are logged server-side instead.

UrbaneBolt-specific handling: their API returns HTTP `200` even when an
order is rejected, with the actual failure embedded in an `errorResponse`
array in the body. The adapter explicitly checks for this and throws, so a
courier-side rejection is never mistaken for a successful creation
downstream.

Retry and re-auth logic (required by the assignment: retry with backoff on
5xx/timeout, automatic re-authentication and one retry on auth failure) is
implemented once, at the HTTP client layer, via axios interceptors — not
duplicated per courier method. A request interceptor attaches a cached
(and auto-refreshed) bearer token to every outgoing UrbaneBolt call; a
response interceptor catches `401` and retries once after clearing the
cached token, and separately catches 5xx/network errors and retries with
exponential backoff up to a configured limit.

## Known limitations / trade-offs

- **Courier config (base URL, timeout, retries) lives in environment
  variables and a per-adapter constructor, not a database table.** Faster
  to build and still fully "configuration-driven, never hardcoded" per the
  requirement, but a `CourierConfig` table (toggle a courier on/off without
  a redeploy) would be the natural next step for a real production system.

- **UrbaneBolt's `trackShipment`/`cancelOrder` status-code mapping is
  based on a single confirmed value** (`MAN` → Shipment Manifested) plus
  reasonable inference for the rest (`PKD`, `INT`, `OFD`, `DEL`, `CAN`) —
  their UAT docs didn't provide a full status code enum. A production
  integration would need UrbaneBolt's complete code table to confirm these.

- **Structured error logging is simplified** to `console.error` with the
  relevant fields, rather than a dedicated `ErrorLog` table or external log
  aggregator — straightforward to add later without touching existing
  tables, since it's purely additive.

- **UrbaneBolt UAT serviceability is limited** — not every pincode is
  serviceable in their test environment (confirmed during integration
  testing), which is a courier-side UAT constraint, not a bug in this
  system; the adapter correctly surfaces this as a normalized rejection
  rather than a generic failure.