import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { ProductionClient } from "../clients/ProductionClient";
import { PerfumeType } from "../Domain/enums/PerfumeType";
import { PerfumeStatus } from "../Domain/enums/PerfumeStatus";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { computeExpirationDate } from "../helpers/ComuteExpirationDate";
import { calculatePrice } from "../helpers/CalculatePrice";
import { toDTO } from "../helpers/ToDTO";

export class ProcessingService implements IProcessingService {
  private productionClient: ProductionClient;

  
  constructor(private perfumeRepo: Repository<Perfume>) {
    this.productionClient = new ProductionClient();
  }


  async processPerfume(perfumeName: string, type: PerfumeType, bottles: number, volumePerBottle: number) {
    const totalMlNeeded = bottles * volumePerBottle;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);

    const plants = await this.productionClient.getPlants(plantsNeeded);
    if (!plants || plants.length < plantsNeeded) {
      throw new Error("Production couldn't provide required plants");
    }
    const plantIds = plants.map(p => p.id!).filter(Boolean) as number[];

    for (const pl of plants) {
      if (pl.aromaticOilStrength && pl.aromaticOilStrength > 4.0) {
        try {
          await this.productionClient.plantAndScale(pl.aromaticOilStrength, 65);
        } catch (err) {
          console.warn("[ProcessingService] plantAndScale failed", (err as Error).message);
        }
      }
    }

    const created: any[] = [];
    for (let i = 0; i < bottles; i++) {
      const p = this.perfumeRepo.create({
        name: perfumeName,
        type,
        netVolumeMl: volumePerBottle,
        sourcePlantIds: plantIds,
        expirationDate: computeExpirationDate(),
        status: PerfumeStatus.AVAILABLE,
      });
      const saved = await this.perfumeRepo.save(p);
      saved.serialNumber = `PP-2025-${saved.id}`;
      await this.perfumeRepo.save(saved);
      created.push(toDTO(saved)); 
    }
    await this.productionClient.sendUsedPlants(plantIds);

    return created;
  }



  async listAvailablePerfumes(): Promise<any[]> {
    const rows = await this.perfumeRepo.find({ where: { status: PerfumeStatus.AVAILABLE } });
    return rows.map(r =>toDTO(r));
  }

  async getPerfumeById(id: number): Promise<any> {
    const p = await this.perfumeRepo.findOne({ where: { id } });
    if (!p) throw new Error("Perfume not found");
    return toDTO(p); 
  }

  async reservePerfumes(name: string, count: number) {
    const rows = await this.perfumeRepo.find({
      where: { name, status: PerfumeStatus.AVAILABLE },
      take: count,
      order: { createdAt: "ASC" },
    });
    if (!rows || rows.length < count) throw new Error("Not enough perfumes available");
    for (const r of rows) {
      r.status = PerfumeStatus.RESERVED;
      await this.perfumeRepo.save(r);
    }
    return rows.map(r => toDTO(r));
  }
}