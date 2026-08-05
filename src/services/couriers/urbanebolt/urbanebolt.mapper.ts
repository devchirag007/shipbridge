import { NormalizedOrderInput } from "../../../types/courier.types";
import { UrbaneBoltManifestItem } from "../../../types/urbanebolt.types";
import { OrderStatusLike } from "../../../types/courier.types";

export function normalizeToUrbaneBolt(
    input: NormalizedOrderInput,
    customerCode: string,
    config: {
        serviceType?: string;
        payMode?: string;
        itemDescription?: string;
    } = {}
): UrbaneBoltManifestItem {
    const { clientOrderId, pickupAddress, deliveryAddress, packageDetails } = input;

    return {
        customerCode,
        orderNumber: clientOrderId,
        declaredValue: packageDetails.declaredValue || 0,
        itemDescription: config.itemDescription || "Shipment",
        collectableValue: 0,
        height: packageDetails.height || 10,
        length: packageDetails.length || 10,
        pieces: 1,
        weight: packageDetails.weightKg,
        breadth: packageDetails.width || 10,
        serviceType: config.serviceType || "SDD",
        payMode: config.payMode || "PPD",

        shprName: pickupAddress.name,
        shprCity: pickupAddress.city,
        shprState: pickupAddress.state,
        shprAddress: pickupAddress.addressLine,
        shprPincode: Number(pickupAddress.pincode),
        shprMobile: Number(pickupAddress.phone),
        shprEmail: pickupAddress.email || "noreply@shipbridge.com",
        shprCountry: "INDIA",
        shprAddressType: "Seller",

        consName: deliveryAddress.name,
        consCity: deliveryAddress.city,
        consState: deliveryAddress.state,
        consAddress: deliveryAddress.addressLine,
        consPincode: Number(deliveryAddress.pincode),
        consMobile: Number(deliveryAddress.phone),
        consEmail: deliveryAddress.email || "noreply@shipbridge.com",
        consCountry: "INDIA",
        consAddressType: "Home",

        rtnName: pickupAddress.name,
        rtnCity: pickupAddress.city,
        rtnState: pickupAddress.state,
        rtnAddress: pickupAddress.addressLine,
        rtnPincode: Number(pickupAddress.pincode),
        rtnMobile: Number(pickupAddress.phone),
        rtnEmail: pickupAddress.email || "noreply@shipbridge.com",
        rtnCountry: "INDIA",
        rtnAddressType: "Seller",

        invoiceNumber: clientOrderId,
        invoiceDate: new Date().toISOString().split("T")[0],
        invoiceValue: packageDetails.declaredValue || 0,
        itemQuantity: 1,
    };
}

export function parseUrbaneBoltResponse(response: unknown): {
    awbNumber: string;
    courierOrderId: string;
    shippingLabel?: string;
} {
    const data = response as {
        successResponse?: Array<{
            awbNumber: number | string;
            orderNumber: string;
            routeCode?: string;
            shippingLabel?: string;
        }>;
    };

    const success = data.successResponse?.[0];
    if (!success) {
        throw new Error("UrbaneBolt response contained no successResponse entry");
    }

    return {
        awbNumber: String(success.awbNumber),
        courierOrderId: success.orderNumber,
        shippingLabel: success.shippingLabel,
    };
}

const URBANEBOLT_STATUS_MAP: Record<string, OrderStatusLike> = {
    MAN: "CREATED",
    PKD: "PICKED_UP",
    INT: "IN_TRANSIT",
    OFD: "OUT_FOR_DELIVERY",
    DEL: "DELIVERED",
    CAN: "CANCELLED",
    RTO: "RTO" as any,
};

export function mapUrbaneBoltStatus(code: string): OrderStatusLike {
    return URBANEBOLT_STATUS_MAP[code] || "IN_TRANSIT"; // safe fallback for unknown/unmapped codes
}