import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export type AuditType = "INFO" | "WARNING" | "ERROR";

export class AuditClient {
  private baseUrl?: string;
  constructor() {
    this.baseUrl = process.env.AUDIT_URL;
  }

  async log(message: string, type: AuditType = "INFO", source: string = "processing", meta?: any): Promise<boolean> {
    try {
      const payload = { message, type, source, meta, timestamp: new Date().toISOString() };
      if (!this.baseUrl) {
        console.log("[Audit-fallback]", payload);
        return true;
      }
      await axios.post(`${this.baseUrl}/log`, payload, { timeout: 5000 });
      return true;
    } catch (err) {
      console.error("[AuditClient] failed to send audit", (err as Error).message);
      return false;
    }
  }
}

export default AuditClient;
