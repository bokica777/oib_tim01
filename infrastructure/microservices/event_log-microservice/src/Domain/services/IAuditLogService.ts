import { AuditLog } from "../models/AuditLog";
import { CreateAuditLogDTO } from "../DTOs/CreateAuditLogDTO";

export interface IAuditLogService {
  createLog(data: CreateAuditLogDTO): Promise<AuditLog>;
  getAllLogs(): Promise<AuditLog[]>;
}
