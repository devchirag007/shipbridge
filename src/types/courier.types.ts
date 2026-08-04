export type OrderStatusLike =
    | "PENDING" | "CREATED" | "PICKED_UP" | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "FAILED";

export interface Address {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
}

export interface PackageDetails {
    weightKg: number;
    length: number;
    width: number;
    height: number;
    declaredValue?: number;
}

export interface NormalizedOrderInput {
    clientOrderId: string;
    pickupAddress: Address;
    deliveryAddress: Address;
    packageDetails: PackageDetails;
}

export interface CreateOrderResult {
    courierOrderId: string;
    awbNumber: string;
    rawRequest: unknown;
    rawResponse: unknown;
}

export interface TrackResult {
    status: string;
    normalizedStatus: OrderStatusLike;
    rawResponse: unknown;
}

export interface CancelResult {
    success: boolean;
    rawResponse: unknown;
}

export interface CourierAdapter {
    readonly code: string;
    createOrder(input: NormalizedOrderInput): Promise<CreateOrderResult>;
    trackShpiment(courierOrderId: string, awbNumber: string): Promise<TrackResult>;
    cancelOrder(courierOrderId: string): Promise<CancelResult>;
}

