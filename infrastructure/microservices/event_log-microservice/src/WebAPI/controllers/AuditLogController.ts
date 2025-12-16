import { Router, Request, Response, NextFunction } from "express";
import { IAuditLogService } from "../../Domain/services/IAuditLogService";
import { CreateAuditLogDTO } from "../../Domain/DTOs/CreateAuditLogDTO";

export class AuditLogController {
  private readonly router: Router;

  constructor(private readonly auditService: IAuditLogService) {
    this.router = Router();
    this.initializeRoutes();
  }

  getRouter(): Router {
    return this.router;
  }

  private initializeRoutes(): void {
    this.router.post("/", this.createLog);
    this.router.get("/", this.getAllLogs);
  }

  private createLog = async (
    req: Request<{}, any, CreateAuditLogDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { type, message } = req.body;

      if (!type || !message) {
        return res.status(400).json({
          message: "type and message are required",
        });
      }

      const log = await this.auditService.createLog({ type, message });
      return res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  private getAllLogs = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const logs = await this.auditService.getAllLogs();
      return res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  };
}
