export interface UrbaneBoltAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    expires: string;
    status: string;
}

export interface UrbaneBoltManifestItem {
    customerCode: string;
    orderNumber: string;
    declaredValue: number;
    itemDescription: string;
    collectableValue: number;
    height: number;
    length: number;
    pieces: number;
    weight: number;
    breadth: number;
    serviceType: string;
    payMode: string;
    rtnCity: string;
    rtnName: string;
    consCity: string;
    consName: string;
    rtnEmail: string;
    rtnState: string;
    shprCity: string;
    shprName: string;
    consEmail: string;
    consState: string;
    rtnMobile: number;
    shprEmail: string;
    shprState: string;
    consMobile: number;
    rtnAddress: string;
    rtnAddressType: string;
    rtnCountry: string;
    rtnPincode: number;
    shprMobile: number;
    consAddress: string;
    consAddressType: string;
    consCountry: string;
    consPincode: number;
    invoiceNumber: string;
    invoiceDate: string;
    shprAddress: string;
    shprAddressType: string;
    shprCountry: string;
    shprPincode: number;
    invoiceValue: number;
    itemQuantity: number;
}

export interface UrbaneBoltManifestResponse {
    status: string;
    message?: string;
    data?: unknown;
    [key: string]: unknown;
}

export interface UrbaneBoltScan {
    statusDateTime: string;
    statusCode: string;
    statusCodeDescription: string;
    reasonCode: string;
    reasonCodeDescription: string;
    currentLocation: string;
}

export interface UrbaneBoltTrackingData {
    awbNumber: number;
    orderNumber: string;
    currentStatusCode: string;
    currentStatusCodeDescription: string;
    currentStatusDateTime: string;
    currentLocation: string;
    isRto: boolean;
    scans: UrbaneBoltScan[];
    [key: string]: unknown;
}

export interface UrbaneBoltTrackingResponse {
    status: string;
    message: string;
    data: UrbaneBoltTrackingData;
}

export interface UrbaneBoltCancelResponse {
    status: string;
    message: string;
    successResponse: Array<{ orderNumber: string; awb: string; message: string }>;
    failureResponse: Array<{ orderNumber?: string; awb?: string; message: string }>;
}