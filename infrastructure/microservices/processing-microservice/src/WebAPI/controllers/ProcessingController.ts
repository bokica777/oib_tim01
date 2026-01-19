import { Router, Request, Response } from "express";
import { ProcessingService } from "../../Services/ProcessingService";
import LogerService from "../../Services/LogerService";
import { Db } from "../../Database/DbConnectionPool";
import { Perfume } from "../../Domain/models/Perfume";
import { validateDTO } from "../../middleware/ValidationMiddleware";
import { ProcessRequestDTO } from "../../Domain/DTOs/ProcessRequestDTO";

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
    this.router.post("/perfumes/request", this.requestPerfumes.bind(this));
  }

  private async processPerfume(req: Request, res: Response) {
    try {
      const dto: ProcessRequestDTO = req.body;
      await this.logger.log(
        `Processing request for ${dto.bottles}x${dto.volumePerBottle}ml of ${dto.perfumeName}`,
        "INFO",
        { perfumeName: dto.perfumeName, bottles: dto.bottles, volumePerBottle: dto.volumePerBottle },
        "processing"
      );

      const produced = await this.service.processPerfume(dto.perfumeName, dto.type, dto.bottles, dto.volumePerBottle);

      await this.logger.log(
        `Processing finished produced=${produced.length}`,
        "INFO",
        { perfumeName: dto.perfumeName, producedCount: produced.length },
        "processing"
      );

      // produced već sadrži price za svaki parfem
      res.status(201).json(produced);
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      await this.logger.log(errMsg, "ERROR", { error: errMsg }, "processing");
      res.status(400).json({ message: errMsg });
    }
  }

  private async getPerfumes(req: Request, res: Response) {
    try {
      const list = await this.service.listAvailablePerfumes();
      // list već sadrži price za svaki parfem
      res.status(200).json(list);
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      await this.logger.log(errMsg, "ERROR", { error: errMsg }, "processing");
      res.status(500).json({ message: errMsg });
    }
  }

  private async getPerfume(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const p = await this.service.getPerfumeById(id);
      // p već sadrži price
      res.status(200).json(p);
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      await this.logger.log(errMsg, "ERROR", { error: errMsg, perfumeId: req.params.id }, "processing");
      res.status(404).json({ message: errMsg });
    }
  }

  private async requestPerfumes(req: Request, res: Response) {
    try {
      const { name, count } = req.body;
      if (!name || !Number.isInteger(count) || count <= 0) {
        res.status(400).json({ message: "Invalid payload" });
        return;
      }
      await this.logger.log(`Packaging request for ${count} of ${name}`, "INFO", { name, count }, "processing");
      const reserved = await this.service.reservePerfumes(name, count);
      // reserved već sadrži price za svaki parfem
      res.status(200).json(reserved);
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      await this.logger.log(errMsg, "ERROR", { error: errMsg }, "processing");
      res.status(400).json({ message: errMsg });
    }
  }

  public getRouter() {
    return this.router;
  }
}