import { AuditType } from "../types/AuditType";

export interface ILogerService {
  log(message: string, type?: AuditType, meta?: any, source?: string): Promise<boolean>;
  getLogs(source?: string, forwardedToken?: string): Promise<any[]>;
}
