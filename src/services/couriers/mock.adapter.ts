import { randomUUID } from "crypto";
import { CancelResult, CourierAdapter, CreateOrderResult, NormalizedOrderInput, TrackResult } from "../../types/courier.types.js";

export class MockCourierAdapter implements CourierAdapter {
    readonly code = "mockcourier";

    async createOrder(input: NormalizedOrderInput): Promise<CreateOrderResult> {
        const courierOrderId = randomUUID().slice(0, 8);
        const awbNumber = `AWB${Date.now()}`

        return {
            courierOrderId,
            awbNumber,
            rawRequest: input,
            rawResponse: {
                status: "success",
                courierOrderId: awbNumber
            }
        }
    }

    async trackShpment(courierOrderId: string, awbNumber: string): Promise<TrackResult> {
        return {
            status: "IN_TRANSIT",
            normalizedStatus: "IN_TRANSIT",
            rawResponse: {
                courierOrderId, start: "IN_TRANSIT"
            }
        }
    }

    async cancelOrder(courierOrderId: string): Promise<CancelResult> {
        return {
            success: true,
            rawResponse: {
                courierOrderId,
                cancelled: true,
            }
        }
    }

}
