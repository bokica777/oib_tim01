// src/Services/ProductionService.ts
import { Repository, In } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { IProductionService } from "../Domain/services/IProductionService";

export class ProductionService implements IProductionService {
  constructor(private readonly plantRepo: Repository<Plant>) {}

  private toDTO(p: Plant) {
    return {
      id: p.id,
      commonName: p.commonName,
      latinName: p.latinName,
      aromaticOilStrength: p.aromaticOilStrength,
      countryOfOrigin: p.countryOfOrigin,
      status: p.status,
    };
  }

  // Plant a new plant; aromaticOilStrength default is random between 1.00 and 5.00
  async plantNew(seedData?: Partial<Plant>): Promise<any> {
    const strength = seedData?.aromaticOilStrength ?? Number((Math.random() * 4 + 1).toFixed(2));
    const plant = this.plantRepo.create({
      commonName: seedData?.commonName ?? "Unknown Plant",
      latinName: seedData?.latinName ?? "Unknown Latin",
      countryOfOrigin: seedData?.countryOfOrigin ?? "Unknown",
      aromaticOilStrength: strength,
      status: PlantStatus.PLANTED,
    });
    const saved = await this.plantRepo.save(plant);
    return this.toDTO(saved);
  }

  // adjust: two modes:
  //  - inc: percent increment (legacy/backwards-compatible)
  //  - scale: set to percent% of current (e.g. 65 => current * 0.65)
  async adjustAromaticStrength(id: number, value: number, mode: "inc" | "scale" = "inc") {
    const plant = await this.plantRepo.findOne({ where: { id } });
    if (!plant) throw new Error("Plant not found");
    if (mode === "inc") {
      const multiplier = value / 100;
      plant.aromaticOilStrength = Number((plant.aromaticOilStrength + plant.aromaticOilStrength * multiplier).toFixed(2));
    } else {
      const factor = value / 100;
      plant.aromaticOilStrength = Number((plant.aromaticOilStrength * factor).toFixed(2));
    }
    const saved = await this.plantRepo.save(plant);
    return this.toDTO(saved);
  }

  // Harvest count plants with given commonName; sets status to HARVESTED
  async harvestMany(commonName: string, count: number) {
    const available = await this.plantRepo.find({
      where: { commonName, status: PlantStatus.PLANTED },
      take: count,
    });
    if (available.length === 0) throw new Error("No plants available");
    for (const p of available) {
      p.status = PlantStatus.HARVESTED;
      await this.plantRepo.save(p);
    }
    return available.map(p => this.toDTO(p));
  }

async markPlantsUsed(ids: number[]) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  // TypeORM 0.3.x: use In(...)
  const plants = await this.plantRepo.findBy({ id: In(ids) });
  for (const p of plants) {
    p.status = PlantStatus.PROCESSED;
    await this.plantRepo.save(p);
  }
}
  // Get N available planted plants
  async getAvailablePlants(count: number) {
    const available = await this.plantRepo.find({ where: { status: PlantStatus.PLANTED }, take: count });
    return available.map(p => this.toDTO(p));
  }

  // Endpoint helper: plant new and set its aromaticOilStrength to sourceStrength * factor (e.g. 0.65)
  async plantAndScale(sourceStrength: number, factor: number = 0.65) {
    const strength = Number((sourceStrength * factor).toFixed(2));
    const p = await this.plantNew({ aromaticOilStrength: strength });
    return p;
  }
}
