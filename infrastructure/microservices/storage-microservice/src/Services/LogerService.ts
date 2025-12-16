import AuditClient, { AuditType } from "../clients/AuditClient";
import { ILogerService } from "../Domain/services/ILogerService";

export class LogerService implements ILogerService {
  private audit = new AuditClient();
  constructor() {
    console.log("\x1b[35m[Logger@processing]\x1b[0m started");
  }

  async log(message: string, type: AuditType = "INFO", meta?: any): Promise<boolean> {
    try {
      console.log(`\x1b[35m[Logger@processing]\x1b[0m [${type}] ${message}`, meta ?? "");
      await this.audit.log(message, type, "processing", meta);
      return true;
    } catch (err) {
      console.error("[Logger] audit failed", (err as Error).message);
      return false;
    }
  }
}
