import axios from "axios";

export type AuditType = "INFO" | "WARNING" | "ERROR";

export class AuditClient {
  private baseUrl = process.env.AUDIT_URL;

  async log(message: string, type: AuditType = "INFO", source = "sales", meta?: any) {
    try {
      if (!this.baseUrl) return;
      await axios.post(`${this.baseUrl}/log`, {
        message,
        type,
        source,
        meta,
        timestamp: new Date().toISOString()
      });
    } catch {
      /* fail silently */
    }
  }
}
