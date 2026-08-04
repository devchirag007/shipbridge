import { prisma } from "../prisma/client.js";
import { NormalizedOrderInput } from "../types/courier.types.js";
import { getCourierAdapter } from "./couriers/registry.js";

export async function createOrder(courierPartner: string, input: NormalizedOrderInput) {
    const existing = await prisma.order.findUnique({
        where: { clientOrderId: input.clientOrderId }
    })
    if (existing) return existing;

    const adapter = getCourierAdapter(courierPartner);

    const order = await prisma.order.create({
        data: {
            clientOrderId: input.clientOrderId,
            courierPartner,
            status: "PENDING",
            normalizedPayload: input as any,
        }
    })

    try {
        const result = await adapter.createOrder(input);

        return await prisma.order.update({
            where: { id: order.id },
            data: {
                status: "CREATED",
                courierOrderId: result.courierOrderId,
                awbNumber: result.awbNumber,
                courierRequest: result.rawRequest as any,
                courierResponse: result.rawResponse as any
            }
        })

    } catch (error: any) {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: "FAILED",
                failureReason: error.message
            }
        })
        throw error;
    }
}