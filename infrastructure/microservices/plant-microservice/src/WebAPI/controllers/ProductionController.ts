import { Router, Request, Response } from "express";
import { IProductionService } from "../../Domain/services/IProductionService";
import { ILogerService } from "../../Domain/services/ILogerService";

export class ProductionController {
  private readonly router: Router;

  constructor(
    private readonly productionService: IProductionService,
    private readonly logger: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/plant", this.plantNew.bind(this));
    this.router.put("/adjust/:id", this.adjustStrength.bind(this));
    this.router.put("/harvest", this.harvestMany.bind(this));
  }

  /** SADNJA */
  private async plantNew(req: Request, res: Response) {
    try {
      this.logger.log("Production → planting new plant");
      const plant = await this.productionService.plantNew(req.body);
      res.status(201).json(plant);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  /** PROMENA JAČINE */
  private async adjustStrength(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const percent = Number(req.body.percent);

      this.logger.log(`Production → adjusting plant ${id} by ${percent}%`);

      const updated = await this.productionService.adjustAromaticStrength(id, percent);
      res.status(200).json(updated);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  /** BERBA */
  private async harvestMany(req: Request, res: Response) {
    try {
      const { commonName, count } = req.body;

      this.logger.log(`Production → harvesting ${count} plants of ${commonName}`);

      const harvested = await this.productionService.harvestMany(commonName, count);
      res.status(200).json(harvested);
    } catch (err) {
      this.logger.log((err as Error).message);
      res.status(400).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
