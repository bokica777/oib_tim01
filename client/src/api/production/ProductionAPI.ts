import { AuditRecord } from "../audit/AuditApi";
import auditAPI from "../audit/AuditApi";

export class ProductionAPI {
  constructor() {}

  async getLogs(): Promise<AuditRecord[]> {
    try {
      return await auditAPI.getLogs("production");
    } catch (err) {
      console.warn("[ProductionAPI] getLogs failed:", (err as Error).message);
      return [];
    }
  }
}

const productionAPI = new ProductionAPI();
export default productionAPI;
