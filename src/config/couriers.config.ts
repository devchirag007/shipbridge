export const couriersConfig = {
    urbanebolt: {
        baseUrl: process.env.URBANEBOLT_BASE_URL!,
        apiKey: process.env.URBANEBOLT_API_KEY!,
        timeoutMs: Number(process.env.URBANEBOLT_TIMEOUT_MS || 10000),
        maxRetries: Number(process.env.URBANEBOLT_MAX_RETRIES || 3),
    },
    mockcourier: {
        baseUrl: "internal",
        timeoutMs: 1000,
        maxRetries: 1,
    },
} as const;

export type CourierCode = keyof typeof couriersConfig;