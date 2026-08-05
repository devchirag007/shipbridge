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