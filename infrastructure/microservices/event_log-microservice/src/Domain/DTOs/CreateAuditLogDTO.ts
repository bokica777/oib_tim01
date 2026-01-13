import { AuditLogType } from "../enums/AuditLogType";

export class CreateAuditLogDTO {
  type!: AuditLogType; // obavezno
  message!: string;
  source?: string;
  meta?: any;
}
