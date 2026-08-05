import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { UrbaneBoltAuthResponse, UrbaneBoltManifestItem, UrbaneBoltManifestResponse } from "../../../types/urbanebolt.types";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retriedAuth?: boolean;
    _retryCount?: number;
}

export class UrbaneBoltClient {
    private http: AxiosInstance;
    private username: string;
    private password: string;
    private token: string | null = null;
    private tokenExpiredAt: Date | null = null;
    private maxRetries: number;


    constructor(baseUrl: string, username: string, password: string, options?: { timeoutMs?: number; maxRetries?: number }) {
        this.username = username;
        this.password = password;
        this.maxRetries = options?.maxRetries ?? 3;

        this.http = axios.create({
            baseURL: baseUrl,
            timeout: options?.timeoutMs ?? 10000,
        })
        this.setupInterceptors();
    }


    private setupInterceptors() {
        this.http.interceptors.request.use(async (config) => {
            const token = await this.getToken();
            config.headers.Authorization = `Bearer ${token}`;
            config.headers.Referer = this.http.defaults.baseURL as string;
            return config;
        });

        this.http.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const config = error.config as RetryableRequestConfig;
                if (!config) throw error;

                if (error.response?.status === 401 && !config._retriedAuth) {
                    config._retriedAuth = true;
                    this.token = null;
                    return this.http.request(config);
                }

                const isRetryable = !error.response || error.response.status >= 500;

                config._retryCount = config._retryCount ?? 0;

                if (isRetryable && config._retryCount < this.maxRetries) {
                    config._retryCount += 1;
                    const delayMs = 500 * 2 ** (config._retryCount - 1);
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                    return this.http.request(config);
                }

                throw error;
            }
        );
    }


    private async getToken(): Promise<string> {
        if (this.token && this.tokenExpiredAt && new Date() < this.tokenExpiredAt) {
            return this.token;
        }
        const url = `${this.http.defaults.baseURL}/api/v1/auth/getToken/`;
        const body = { username: this.username, password: this.password };
        const headers = { "Content-Type": "application/json" };
        const response = await axios.post<UrbaneBoltAuthResponse>(url, body, { headers })

        this.token = response.data.access_token;
        this.tokenExpiredAt = new Date(response.data.expires)
        return this.token
    }

    async createManifest(items: UrbaneBoltManifestItem[]): Promise<UrbaneBoltManifestResponse> {
        const url = "/api/v1/services/manifest/"
        const response = await this.http.post<UrbaneBoltManifestResponse>(url, items);
        return response.data;
    }
}