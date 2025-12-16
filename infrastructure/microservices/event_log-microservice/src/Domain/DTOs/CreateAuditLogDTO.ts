import { AuditLogType } from "../enums/AuditLogType";

export interface CreateAuditLogDTO {
  type: AuditLogType;
  message: string;
}
