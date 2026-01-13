import AuditClient, { AuditType } from "../clients/AuditClient";
import { ILogerService } from "../Domain/services/ILogerService";

export class LogerService implements ILogerService {
  private audit = new AuditClient();
  constructor() {
    console.log("\x1b[35m[Logger]\x1b[0m started");
  }

  async log(message: string, type: AuditType = "INFO", meta?: any, source: string = "production"): Promise<boolean> {
    try {
      console.log(`\x1b[35m[Logger]\x1b[0m [${type}] [${source}] ${message}`, meta ?? "");
      await this.audit.log(message, type, source, meta);
      return true;
    } catch (err) {
      console.error("[Logger] audit failed", (err as Error).message);
      return false;
    }
  }

  async getLogs(source?: string, forwardedToken?: string): Promise<any[]> {
    try {
      const token = forwardedToken ?? undefined;
      const logs = await this.audit.getLogs(source, token);
      return Array.isArray(logs) ? logs : [];
    } catch (err) {
      console.error("[Logger] getLogs failed", (err as Error).message);
      return [];
    }
  }
}

export default LogerService;
