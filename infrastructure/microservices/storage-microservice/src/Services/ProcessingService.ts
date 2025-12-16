import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { ProductionClient } from "../clients/PackagingClient";
import { PerfumeType } from "../Domain/enums/PerfumeType";
import { PerfumeStatus } from "../Domain/enums/PerfumeStatus";
import { IProcessingService } from "../Domain/services/IProcessingService";

export class ProcessingService implements IProcessingService {
  private productionClient: ProductionClient;
  constructor(private perfumeRepo: Repository<Perfume>) {
    this.productionClient = new ProductionClient();
  }

  private toDTO(p: Perfume) {
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      netVolumeMl: p.netVolumeMl,
      serialNumber: p.serialNumber,
      sourcePlantIds: p.sourcePlantIds,
      expirationDate: p.expirationDate?.toISOString(),
      status: p.status,
    };
  }

  async processPerfume(perfumeName: string, type: PerfumeType, bottles: number, volumePerBottle: number) {
    const totalMlNeeded = bottles * volumePerBottle;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);

    const plants = await this.productionClient.getPlants(plantsNeeded);
    if (!plants || plants.length < plantsNeeded) {
      throw new Error("Production couldn't provide required plants");
    }
    const plantIds = plants.map(p => p.id!).filter(Boolean) as number[];

    // If any plant has aromaticOilStrength > 4.00 -> request production to plant scaled one
    for (const pl of plants) {
      if (pl.aromaticOilStrength && pl.aromaticOilStrength > 4.0) {
        try {
          // ask production to plant scaled offspring with factor 65%
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
        expirationDate: this.computeExpirationDate(),
        status: PerfumeStatus.AVAILABLE,
      });
      const saved = await this.perfumeRepo.save(p);
      saved.serialNumber = `PP-2025-${saved.id}`;
      await this.perfumeRepo.save(saved);
      created.push(this.toDTO(saved));
    }
    await this.productionClient.sendUsedPlants(plantIds);

    return created;
  }

  computeExpirationDate(): Date {
    // for demo: expiration 365 days from now; could be configurable
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d;
  }

  async listAvailablePerfumes(): Promise<any[]> {
    const rows = await this.perfumeRepo.find({ where: { status: PerfumeStatus.AVAILABLE } });
    return rows.map(r => this.toDTO(r));
  }

  async getPerfumeById(id: number): Promise<any> {
    const p = await this.perfumeRepo.findOne({ where: { id } });
    if (!p) throw new Error("Perfume not found");
    return this.toDTO(p);
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
    return rows.map(r => this.toDTO(r));
  }
}
