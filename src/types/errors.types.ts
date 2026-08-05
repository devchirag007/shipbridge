export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errorCode: string,
        public details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends AppError {
    constructor(details: unknown) {
        super("Validation failed", 400, "VALIDATION_ERROR", details);
    }
}

export class UnknownCourierError extends AppError {
    constructor(courierCode: string, supported: string[]) {
        super(`Unknown courier_partner: "${courierCode}"`, 400, "UNKNOWN_COURIER", { supported })
    }
}

export class CourierApiError extends AppError {
    constructor(message: string, public rawError?: unknown) {
        super(message, 502, "COURIER_API_ERROR");
    }
}

export class OrderNotFoundError extends AppError {
    constructor(orderId: string) {
        super(`Order not found: ${orderId}`, 404, "ORDER_NOT_FOUND");
    }
}