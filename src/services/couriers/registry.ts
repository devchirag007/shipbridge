import { CourierAdapter } from "../../types/courier.types.js";
import { UnknownCourierError } from "../../types/errors.types.js";
import { MockCourierAdapter } from "./mock.adapter.js";
import { UrbaneBoltAdapter } from "./urbanebolt/urbanebolt.adapter.js";

const registry = new Map<string, CourierAdapter>([
    ["urbanebolt", new UrbaneBoltAdapter()],
    ["mockcourier", new MockCourierAdapter()]
])

export function getCourierAdapter(code: string): CourierAdapter {
    const adapter = registry.get(code);
    if (!adapter) {
        throw new UnknownCourierError(code, Array.from(registry.keys()));
    }
    return adapter;
}
