import { prisma } from "../prisma/client";
import { bulkOrderQueue } from "../queues/bulk.queue";

interface BulkOrderInput {
    clientOrderId: string;
    courier_partner: string;
    [key: string]: any;
}

export async function createbulkBatch(orders: BulkOrderInput[]) {

    const batch = await prisma.bulkBatch.create({
        data: { totalOrders: orders.length }
    })

    for (const order of orders) {
        const { courier_partner, clientOrderId, ...payload } = order;

        const item = await prisma.bulkBatchItem.upsert({
            where: { batchId_clientOrderId: { batchId: batch.id, clientOrderId } },
            update: {},
            create: {
                batchId: batch.id,
                clientOrderId,
                courierPartner: courier_partner,
                payload,
            }
        })

        await bulkOrderQueue.add("process-order", { batchItemId: item.id }, {
            jobId: `${batch.id}-${clientOrderId}`,
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 }
        })
    }

    return batch;
}

export async function getBulkBatchStatus(batchId: string) {
    const items = await prisma.bulkBatchItem.findMany({ where: { batchId } })

    const successCount = items.filter((i) => i.status === "SUCCESS").length;
    const failureCount = items.filter((i) => i.status === "FAILED").length;
    const pendingCount = items.filter((i) => i.status === "PENDING").length;

    return {
        batchId,
        total: items.length,
        successCount,
        failureCount,
        pendingCount,
        status: pendingCount > 0 ? "PROCESSING" : "COMPLETED",
        items: items.map(i => ({
            clientOrderId: i.clientOrderId,
            status: i.status,
            orderId: i.orderId,
            errorMessage: i.errorMessage
        }))
    }


}