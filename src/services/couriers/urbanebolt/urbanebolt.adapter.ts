import { CancelResult, CourierAdapter, CreateOrderResult, NormalizedOrderInput, TrackResult } from "../../../types/courier.types";
import { UrbaneBoltClient } from "./urbanebolt.client";
import { mapUrbaneBoltStatus, normalizeToUrbaneBolt, parseUrbaneBoltResponse } from "./urbanebolt.mapper";

export class UrbaneBoltAdapter implements CourierAdapter {
    readonly code = "urbanebolt";
    private client: UrbaneBoltClient;
    private customerCode: string;

    constructor() {
        const baseUrl = process.env.URBANEBOLT_BASE_URL || "https://uat.urbanebolt.in";
        const username = process.env.URBANEBOLT_USERNAME || "";
        const password = process.env.URBANEBOLT_PASSWORD || "";
        this.customerCode = process.env.URBANEBOLT_CUSTOMER_CODE || "";

        this.client = new UrbaneBoltClient(baseUrl, username, password, {
            timeoutMs: Number(process.env.URBANEBOLT_TIMEOUT_MS || 10000),
            maxRetries: Number(process.env.URBANEBOLT_MAX_RETRIES || 3),
        });
    }

    async createOrder(input: NormalizedOrderInput): Promise<CreateOrderResult> {
        const urbaneItem = normalizeToUrbaneBolt(input, this.customerCode);
        const response = await this.client.createManifest([urbaneItem]);

        const errors = (response as any).errorResponse;
        if (Array.isArray(errors) && errors.length > 0) {
            throw new Error(`UrbaneBolt rejected order: ${errors[0].message}`);
        }

        const parsed = parseUrbaneBoltResponse(response);

        return {
            courierOrderId: parsed.courierOrderId,
            awbNumber: parsed.awbNumber,
            rawRequest: urbaneItem,
            rawResponse: response
        }
    }

    async trackShpiment(courierOrderId: string, awbNumber: string): Promise<TrackResult> {
        const response = await this.client.trackShipment(awbNumber);

        return {
            status: response.data.currentStatusCode,
            normalizedStatus: mapUrbaneBoltStatus(response.data.currentStatusCode),
            rawResponse: response,
        };
    }

    async cancelOrder(courierOrderId: string, awbNumber: string): Promise<CancelResult> {

        if (!awbNumber) {
            throw new Error("cancelOrder requires as awbNumber for UrbaneBolt");
        }

        const response = await this.client.cancelShipment(awbNumber);
        const succeeded = response.successResponse.length > 0

        return {
            success: succeeded,
            rawResponse: response
        };
    }
}