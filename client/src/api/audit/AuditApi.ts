// src/api/audit/AuditAPI.ts
import axios, { AxiosInstance } from "axios";

export type AuditRecord = {
  id?: number;
  type: "INFO" | "WARNING" | "ERROR";
  message: string;
  source?: string;
  meta?: any;
  createdAt?: string;
  timestamp?: string;
};

export class AuditAPI {
  private readonly base: string;
  private client: AxiosInstance;

  constructor() {
    const raw = (import.meta.env.VITE_GATEWAY_URL as string) ?? "http://localhost:4000";
    this.base = raw.replace(/\/+$/, ""); // no trailing slash

    // assume gateway exposes audit under /api/v1/audit
    const auditBase = this.base.endsWith("/api/v1") ? `${this.base}` : `${this.base}/api/v1`;

    this.client = axios.create({
      baseURL: auditBase,
      timeout: 8000,
      headers: { "Content-Type": "application/json" },
    });
  }

  private auditEndpoint(): string {
    // final endpoint: {GATEWAY}/api/v1/audit
    return `/audit`;
  }

  private headers() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async getLogs(source?: string): Promise<AuditRecord[]> {
    try {
      const params = source ? { source } : undefined;
      const resp = await this.client.get<AuditRecord[]>(this.auditEndpoint(), {
        headers: this.headers(),
        params,
      });
      return resp.data ?? [];
    } catch (err) {
      console.warn("[AuditAPI] getLogs failed:", (err as any)?.message ?? err);
      return [];
    }
  }

  async createLog(payload: Partial<AuditRecord>): Promise<any> {
    try {
      const resp = await this.client.post(this.auditEndpoint(), payload, { headers: this.headers() });
      return resp.data;
    } catch (err) {
      console.warn("[AuditAPI] createLog failed:", (err as any)?.message ?? err);
      throw err;
    }
  }
}

export const auditAPI = new AuditAPI();
export default auditAPI;
