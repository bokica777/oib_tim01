import { Router, Request, Response } from "express";
import { ProcessingService } from "../../Services/ProcessingService";
import { LogerService } from "../../Services/LogerService";
import { Db } from "../../Database/DbConnectionPool";
import { Perfume } from "../../Domain/models/StoragePackage";
import { validateDTO } from "../../middleware/ValidationMiddleware";
import { ProcessRequestDTO } from "../../Domain/DTOs/StoragePackageDTO";

export class ProcessingController {
  private router: Router;
  private service: ProcessingService;
  private logger: LogerService;

  constructor() {
    this.router = Router();
    const repo = Db.getRepository(Perfume);
    this.service = new ProcessingService(repo);
    this.logger = new LogerService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/process", validateDTO(ProcessRequestDTO), this.processPerfume.bind(this));
    this.router.get("/perfumes", this.getPerfumes.bind(this));
    this.router.get("/perfumes/:id", this.getPerfume.bind(this));
    this.router.post("/perfumes/request", this.requestPerfumes.bind(this)); // used by packaging
  }

  private async processPerfume(req: Request, res: Response) {
    try {
      const dto: ProcessRequestDTO = req.body;
      await this.logger.log(`Processing request for ${dto.bottles}x${dto.volumePerBottle}ml of ${dto.perfumeName}`, "INFO");
      const produced = await this.service.processPerfume(dto.perfumeName, dto.type, dto.bottles, dto.volumePerBottle);
      await this.logger.log(`Processing finished produced=${produced.length}`, "INFO", { perfumeName: dto.perfumeName });
      res.status(201).json(produced);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getPerfumes(req: Request, res: Response) {
    try {
      const list = await this.service.listAvailablePerfumes();
      res.status(200).json(list);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPerfume(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const p = await this.service.getPerfumeById(id);
      res.status(200).json(p);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async requestPerfumes(req: Request, res: Response) {
    try {
      const { name, count } = req.body;
      if (!name || !Number.isInteger(count) || count <= 0) {
        res.status(400).json({ message: "Invalid payload" });
        return;
      }
      await this.logger.log(`Packaging request for ${count} of ${name}`, "INFO");
      const reserved = await this.service.reservePerfumes(name, count);
      res.status(200).json(reserved);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter() {
    return this.router;
  }
}
