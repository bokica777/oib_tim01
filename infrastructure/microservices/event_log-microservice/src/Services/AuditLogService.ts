import { Repository } from "typeorm";
import { AuditLog } from "../Domain/models/AuditLog";
import { IAuditLogService } from "../Domain/services/IAuditLogService";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";

export class AuditLogService implements IAuditLogService {
  constructor(private readonly repo: Repository<AuditLog>) {}

  async createLog(data: CreateAuditLogDTO): Promise<AuditLog> {
    const log = this.repo.create(data);
    return await this.repo.save(log);
  }

  async getAllLogs(): Promise<AuditLog[]> {
    return await this.repo.find({
      order: { createdAt: "DESC" },
    });
  }
}
