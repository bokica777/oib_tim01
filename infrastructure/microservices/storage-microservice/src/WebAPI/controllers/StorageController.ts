// src/WebAPI/controllers/StorageController.ts
import { Router, Request, Response } from "express";
import { StorageService } from "../../Services/StorageService";
import { Db } from "../../Database/DbConnectionPool";
import { StoragePackage } from "../../Domain/models/StoragePackage";
import { validateDTO } from "../../middleware/ValidationMiddleware";
import { StorePackageDTO } from "../../Domain/DTOs/StoragePackageDTO"; 
import { SendRequestDTO } from "../../Domain/DTOs/SendRequestDTO";
import { LogerService } from "../../Services/LogerService";


import { DistributiveCenter } from "../../Services/DistributiveCenterService";
import { WarehouseCenter } from "../../Services/WarehouseCenterService"; 

export class StorageController {
  public router: Router;
  private service: StorageService;
  private logger: LogerService;

  constructor() {
    this.router = Router();
    const pkgRepo = Db.getRepository(StoragePackage);

    const distributive = new DistributiveCenter(pkgRepo);
    const warehouse = new WarehouseCenter(pkgRepo);

    this.service = new StorageService(pkgRepo, distributive, warehouse);
    this.logger = new LogerService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/store", validateDTO(StorePackageDTO), this.storePackage.bind(this));
    this.router.post("/send", validateDTO(SendRequestDTO), this.sendPackages.bind(this));
    this.router.get("/packages", this.listAvailable.bind(this));
  }

private async storePackage(req: Request, res: Response) {
  try {
    const dto: StorePackageDTO = req.body;
    const saved = await this.service.storePackage(dto as any);
    await this.logger.log(`Stored package id=${saved.id}`, "INFO", { warehouseId: saved.warehouseId });
    res.status(201).json(saved);
  } catch (err) {
    await this.logger.log((err as Error).message, "ERROR");
    res.status(400).json({ message: (err as Error).message });
  }
}

  private async sendPackages(req: Request, res: Response) {
    try {
      const dto: SendRequestDTO = req.body;
      const role = req.user?.role;
      await this.logger.log(`Send request from role=${role} count=${dto.count}`, "INFO");
      const sent = await this.service.sendPackagesForRole(role, dto.count);
      if (!sent || sent.length === 0) {
        await this.logger.log("No packages available to send", "WARNING");
        return res.status(404).json({ message: "No packages available" });
      }
      await this.logger.log(`Sent ${sent.length} packages`, "INFO", { packageIds: sent.map(s => s.id) });
      res.status(200).json(sent);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async listAvailable(req: Request, res: Response) {
    try {
      const list = await this.service.listAvailable();
      res.status(200).json(list);
    } catch (err) {
      await this.logger.log((err as Error).message, "ERROR");
      res.status(500).json({ message: (err as Error).message });
    }
  }
}
