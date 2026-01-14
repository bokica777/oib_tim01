// src/clients/AuditClient.ts  (server-side services: processing, production)
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export type AuditType = "INFO" | "WARNING" | "ERROR";

export class AuditClient {
  private gatewayAuditEndpoint?: string;

  constructor() {
    const gateway = (process.env.GATEWAY_URL ?? "").replace(/\/+$/, "");
    if (!gateway) {
      this.gatewayAuditEndpoint = undefined;
      return;
    }
    // Gateway exposes /api/v1/audit
    this.gatewayAuditEndpoint = gateway.endsWith("/api/v1") ? `${gateway}/audit` : `${gateway}/api/v1/audit`;
  }

  // send audit event via gateway to audit microservice
  async log(message: string, type: AuditType = "INFO", source = "production", meta?: any): Promise<boolean> {
    try {
      const payload = { message, type, source, meta, timestamp: new Date().toISOString() };
      if (!this.gatewayAuditEndpoint) { console.log("[AuditClient-fallback]", payload); return true; }

      // include gateway secret header so gateway can authenticate internal calls
      const headers: any = { "Content-Type": "application/json", "x-gateway-key": process.env.GATEWAY_SECRET ?? "" };

      await axios.post(this.gatewayAuditEndpoint, payload, { headers, timeout: 5000 });
      return true;
    } catch (err) {
      console.error("[AuditClient] failed to send via gateway:", (err as Error).message);
      return false;
    }
  }

  // read logs via gateway (gateway will forward to audit service)
  async getLogs(source?: string, token?: string): Promise<any[]> {
    try {
      if (!this.gatewayAuditEndpoint) return [];
      const url = source ? `${this.gatewayAuditEndpoint}?source=${encodeURIComponent(source)}` : this.gatewayAuditEndpoint;
      const headers: any = { "Content-Type": "application/json", "x-gateway-key": process.env.GATEWAY_SECRET ?? "" };
      // optionally add forwarded token (if you want gateway to forward as user)
      if (token) headers.Authorization = token.startsWith("Bearer") ? token : `Bearer ${token}`;

      const resp = await axios.get<any[]>(url, { headers, timeout: 8000 });
      return resp.data ?? [];
    } catch (err) {
      console.error("[AuditClient] getLogs via gateway failed:", (err as Error).message);
      return [];
    }
  }
}

export default AuditClient;
