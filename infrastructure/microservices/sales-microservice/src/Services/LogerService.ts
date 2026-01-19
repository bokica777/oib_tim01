import AuditClient from "../clients/AuditClient";
import { AuditType } from "../Domain/types/AuditType";

export class LogerService {
  private audit = new AuditClient();
  async log(message: string, type: AuditType = "INFO", meta?: any, source: string = "processing"): Promise<boolean> {
    try {
      console.log(`[Logger] [${type}] ${message}`);
      await this.audit.log(message, type, source, meta);
      return true;
    } catch (err) {
      console.error("[Logger] audit failed", (err as Error).message);
      return false;
    }
  }
}
