import "dotenv/config";
import { Worker, Job } from "bullmq";
import { redisConnection } from "./queues/bulk.queue";
import { prisma } from "./prisma/client";
import { getCourierAdapter } from "./services/couriers/registry";

interface BulkOrderJobData {
    batchItemId: string;
}

const worker = new Worker<BulkOrderJobData>("bulk-order-processing", async (job: Job<BulkOrderJobData>) => {
    const item = await prisma.bulkBatchItem.findUniqueOrThrow({ where: { id: job.data.batchItemId } });

    const existingOrder = await prisma.order.findUnique({ where: { clientOrderId: item.clientOrderId } });

    if (existingOrder) {
        await prisma.bulkBatchItem.update({
            where: { id: item.id },
            data: { status: "SUCCESS", orderId: existingOrder.id }
        })
        return
    }

    const order = await prisma.order.create({
        data: {
            clientOrderId: item.clientOrderId,
            courierPartner: item.courierPartner,
            status: "PENDING",
            normalizedPayload: item.payload as any
        }
    })

    try {
        const adapter = getCourierAdapter(item.courierPartner);
        const result = await adapter.createOrder(item.payload as any);

        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: "CREATED",
                courierOrderId: result.courierOrderId,
                awbNumber: result.awbNumber,
                courierRequest: result.rawRequest as any,
                courierResponse: result.rawResponse as any,
            },
        });

        await prisma.bulkBatchItem.update({
            where: { id: item.id },
            data: { status: "SUCCESS", orderId: order.id },
        });
    } catch (err: any) {
        await prisma.order.update({
            where: { id: order.id },
            data: { status: "FAILED", failureReason: err.message },
        });

        await prisma.bulkBatchItem.update({
            where: { id: item.id },
            data: { status: "FAILED", errorMessage: err.message, orderId: order.id },
        });

        throw err;
    }
},
    { connection: redisConnection, concurrency: 10 }
);

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) => console.log(`Job ${job?.id} failed:`, err.message));

console.log("Bulk order worker started, listening for jobs...");