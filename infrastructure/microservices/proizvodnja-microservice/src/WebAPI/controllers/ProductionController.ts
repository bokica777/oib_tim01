// src/WebAPI/controllers/ProductionController.ts
import { Router, Request, Response } from "express";
import { ProductionService } from "../../Services/ProductionService";
import { PlantDTO } from "../../Domain/DTOs/PlantDTO";
import { ILogerService } from "../../Domain/services/ILogerService";

export class ProductionController {
  private router: Router;
  constructor(private service: ProductionService, private logger: ILogerService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/plant", this.plantNew.bind(this)); // plant a single
    this.router.put("/adjust/:id", this.adjustStrength.bind(this)); // adjust existing
    this.router.put("/harvest", this.harvestMany.bind(this)); // harvest by name+count
    this.router.get("/plants", this.getPlants.bind(this)); // get N available plants
    this.router.post("/plants/used", this.markPlantsUsed.bind(this)); // mark ids as used/processed
    this.router.post("/balance", this.plantAndScale.bind(this)); // special: plant scaled by source strength (used by processing)
  }

  async plantNew(req: Request, res: Response) {
    try {
      await this.logger.log("plantNew requested", "INFO");
      const dto: PlantDTO = req.body;
      const p = await this.service.plantNew(dto as any);
      await this.logger.log(`planted id=${p.id}`, "INFO");
      res.status(201).json(p);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async adjustStrength(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { value, mode } = req.body;
      if (!Number.isFinite(value)) throw new Error("Invalid value");
      const m: "inc" | "scale" = mode === "scale" ? "scale" : "inc";
      await this.logger.log(`adjust id=${id} value=${value} mode=${m}`, "INFO");
      const updated = await this.service.adjustAromaticStrength(id, value, m);
      res.json(updated);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async harvestMany(req: Request, res: Response) {
    try {
      const { commonName, count } = req.body;
      if (!commonName || !Number.isInteger(count) || count <= 0) {
        return res.status(400).json({ message: "Invalid payload" });
      }
      await this.logger.log(`harvest ${count} of ${commonName}`, "INFO");
      const result = await this.service.harvestMany(commonName, count);
      res.json(result);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(400).json({ message: (err as Error).message });
    }
  }

  async getPlants(req: Request, res: Response) {
    try {
      const count = Number(req.query.count ?? 1);
      if (!Number.isInteger(count) || count <= 0) return res.status(400).json({ message: "Invalid count" });
      await this.logger.log(`getPlants count=${count}`, "INFO");
      const data = await this.service.getAvailablePlants(count);
      res.json(data);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(500).json({ message: (err as Error).message });
    }
  }

  async markPlantsUsed(req: Request, res: Response) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.some((i: any) => !Number.isInteger(i))) {
        return res.status(400).json({ message: "Invalid ids" });
      }
      await this.logger.log(`markPlantsUsed ids=${ids.join(",")}`, "INFO");
      await this.service.markPlantsUsed(ids);
      res.status(204).send();
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(500).json({ message: (err as Error).message });
    }
  }

// only showing the plantAndScale handler (replace in controller)
async plantAndScale(req: Request, res: Response) {
  try {
    const { sourceStrength, factor } = req.body;
    if (!Number.isFinite(sourceStrength)) return res.status(400).json({ message: "Invalid sourceStrength" });
    // normalize factor: accept either decimal (0.65) or percent (65)
    let f = Number.isFinite(Number(factor)) ? Number(factor) : 0.65;
    if (f > 1) f = f / 100; // if user sent 65 -> convert to 0.65
    await this.logger.log(`plantAndScale sourceStrength=${sourceStrength} factor=${f}`, "INFO");
    const p = await this.service.plantAndScale(sourceStrength, f);
    res.status(201).json(p);
  } catch (err) {
    await this.logger.log((err as Error).message, "ERROR");
    res.status(500).json({ message: (err as Error).message });
  }
}


  public getRouter() {
    return this.router;
  }
}
