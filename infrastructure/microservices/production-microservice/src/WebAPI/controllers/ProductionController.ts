// src/WebAPI/controllers/ProductionController.ts
import { Router, Request, Response } from "express";
import { ProductionService } from "../../Services/ProductionService";
import { ILogerService } from "../../Domain/services/ILogerService";

export class ProductionController {
  private router: Router;

  constructor(
  private service: ProductionService,
  private logger: ILogerService
) {
  this.router = Router();
  this.initializeRoutes();
}


  private initializeRoutes() {
    this.router.post("/plant", this.plantNew.bind(this));
    this.router.put("/adjust/:id", this.adjustStrength.bind(this));
    this.router.put("/harvest", this.harvestMany.bind(this));
    this.router.get("/plants", this.getPlants.bind(this));
    this.router.post("/plants/used", this.markPlantsUsed.bind(this));
    this.router.post("/balance", this.plantAndScale.bind(this));
    this.router.get("/logs", this.getLogs.bind(this)); // ⬅️ NOVO
  }

  async plantNew(req: Request, res: Response) {
  try {
    const p = await this.service.plantNew(req.body);
    await this.logger.log("Plant planted", "INFO", { plantId: p.id });
    res.status(201).json(p);
  } catch (err) {
    await this.logger.log("Plant planting failed", "ERROR", { error: (err as Error).message });
    res.status(400).json({ message: (err as Error).message });
  }
}


  async adjustStrength(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { value, mode } = req.body;
      if (!Number.isFinite(value)) throw new Error("Invalid value");

      const updated = await this.service.adjustAromaticStrength(
        id,
        value,
        mode === "scale" ? "scale" : "inc"
      );

      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async harvestMany(req: Request, res: Response) {
    try {
      const { commonName, count } = req.body;
      if (!commonName || !Number.isInteger(count) || count <= 0) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const result = await this.service.harvestMany(commonName, count);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async getPlants(req: Request, res: Response) {
    try {
      const count = Number(req.query.count ?? 50);
      if (!Number.isInteger(count) || count <= 0) {
        return res.status(400).json({ message: "Invalid count" });
      }

      const data = await this.service.getAvailablePlants(count);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  async markPlantsUsed(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.some(i => !Number.isInteger(i))) {
        return res.status(400).json({ message: "Invalid ids" });
      }

      await this.service.markPlantsUsed(ids);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async plantAndScale(req: Request, res: Response) {
  try {
    const { sourceStrength } = req.body;
    if (!Number.isFinite(sourceStrength)) {
      return res.status(400).json({ message: "Invalid sourceStrength" });
    }

    const p = await this.service.plantAndScale(sourceStrength);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}


  async getLogs(req: Request, res: Response) {
    try {
      const logs = await this.service.getProductionLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public getRouter() {
    return this.router;
  }
}
