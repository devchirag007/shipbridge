import { CourierAdapter } from "../../types/courier.types.js";
import { MockCourierAdapter } from "./mock.adapter.js";

const registry = new Map<string, CourierAdapter>([
    ["mockcourier", new MockCourierAdapter()]
])

export function getCourierAdapter(code: string): CourierAdapter {
    const adapter = registry.get(code);
    if (!adapter) {
        throw new UnknownCourierError(code, Array.from(registry.keys()));
    }
    return adapter;
}

export class UnknownCourierError extends Error {
    constructor(public courierCode: string, public supported: string[]) {
        super(`Unknown courier_partner: "${courierCode}". Supported: ${supported.join(", ")}`);
        this.name = "UnknwonCourierError";
    }

}