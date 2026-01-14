// src/WebAPI/controllers/AuditLogController.ts
import { Router, Request, Response } from "express";
import { IAuditLogService } from "../../Domain/services/IAuditLogService";
import { CreateAuditLogDTO } from "../../Domain/DTOs/CreateAuditLogDTO";
import { validateDTO } from "../../Middlewares/validation/ValidationMiddleware";

export class AuditLogController {
  private readonly router: Router;

  constructor(private readonly service: IAuditLogService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/", validateDTO(CreateAuditLogDTO), this.createLog.bind(this));
    this.router.get("/", this.getLogs.bind(this));
  }

  private async createLog(req: Request, res: Response) {
    try {
      const dto: CreateAuditLogDTO = req.body;
      const log = await this.service.createLog(dto);
      res.status(201).json(log);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  private async getLogs(req: Request, res: Response) {
    try {
      const source = req.query.source?.toString();
      const logs = await this.service.getLogsBySource(source);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
