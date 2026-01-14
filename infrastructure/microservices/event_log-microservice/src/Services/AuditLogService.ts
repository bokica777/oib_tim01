// src/Services/AuditLogService.ts
import { Repository } from "typeorm";
import { AuditLog } from "../Domain/models/AuditLog";
import { IAuditLogService } from "../Domain/services/IAuditLogService";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";

export class AuditLogService implements IAuditLogService {
  constructor(private readonly repo: Repository<AuditLog>) {}

  async createLog(data: CreateAuditLogDTO): Promise<AuditLog> {
    const log = this.repo.create({
      type: data.type,
      message: data.message,
      source: data.source,
      meta: data.meta,
    });
    return this.repo.save(log);
  }

  async getAllLogs(): Promise<AuditLog[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async getLogsBySource(source?: string): Promise<AuditLog[]> {
    const qb = this.repo.createQueryBuilder("log");
    if (source) qb.where("log.source = :source", { source });
    qb.orderBy("log.createdAt", "DESC");
    return qb.getMany();
  }
}
