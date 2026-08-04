-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "BatchItemStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "client_order_id" TEXT NOT NULL,
    "courier_partner" TEXT NOT NULL,
    "courier_order_id" TEXT,
    "awb_number" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "normalized_payload" JSONB NOT NULL,
    "courier_request" JSONB,
    "courier_response" JSONB,
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "occured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_batches" (
    "id" TEXT NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "client_order_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "order_id" TEXT,
    "status" "BatchItemStatus" NOT NULL DEFAULT 'PENDING',
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_client_order_id_key" ON "orders"("client_order_id");

-- CreateIndex
CREATE INDEX "orders_courier_partner_idx" ON "orders"("courier_partner");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "tracking_events_order_id_occured_at_idx" ON "tracking_events"("order_id", "occured_at");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_batch_items_order_id_key" ON "bulk_batch_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_batch_items_batch_id_client_order_id_key" ON "bulk_batch_items"("batch_id", "client_order_id");

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_batch_items" ADD CONSTRAINT "bulk_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "bulk_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_batch_items" ADD CONSTRAINT "bulk_batch_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
