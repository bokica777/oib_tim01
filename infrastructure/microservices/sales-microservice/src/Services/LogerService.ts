import { AuditClient } from "../clients/AuditClient";

export class LogerService {
  private audit = new AuditClient();

  async log(message: string, type: "INFO" | "WARNING" | "ERROR" = "INFO", meta?: any) {
    console.log(`[Sales Log] ${type} - ${message}`);
    await this.audit.log(message, type, "sales", meta);
  }
}
