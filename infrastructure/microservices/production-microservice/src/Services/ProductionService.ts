import { Repository, In } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { IProductionService } from "../Domain/services/IProductionService";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";
import { ProductionLogItem } from "../Domain/types/ProductionLogItem";
import { toDTO } from "../Domain/helpers/toDTO";

export class ProductionService implements IProductionService {
  constructor(private readonly plantRepo: Repository<Plant>) { }

  private logs: ProductionLogItem[] = [];

  private addLog(message: string) {
    this.logs.unshift({
      time: new Date().toISOString(),
      message,
    });
  }

  async plantNew(seedData?: Partial<PlantDTO>): Promise<PlantDTO> {
    const strength =
      seedData?.aromaticOilStrength ??
      Number((Math.random() * 4 + 1).toFixed(2));

    const plant = this.plantRepo.create({
      commonName: seedData?.commonName ?? "Unknown Plant",
      latinName: seedData?.latinName ?? "Unknown Latin",
      countryOfOrigin: seedData?.countryOfOrigin ?? "Unknown",
      aromaticOilStrength: strength,
      status: PlantStatus.PLANTED,
    });

    const saved = await this.plantRepo.save(plant);
    this.addLog(
      `Zasađena biljka "${saved.commonName}" (jačina: ${saved.aromaticOilStrength})`
    );

    return toDTO(saved);
  }

  async adjustAromaticStrength(
    plantId: number,
    value: number,
    mode: "inc" | "scale" = "inc"
  ): Promise<PlantDTO> {
    const plant = await this.plantRepo.findOne({ where: { id: plantId } });
    if (!plant) throw new Error("Plant not found");

    const before = plant.aromaticOilStrength;

    if (mode === "inc") {
      const multiplier = value / 100;
      plant.aromaticOilStrength = Number(
        (
          plant.aromaticOilStrength +
          plant.aromaticOilStrength * multiplier
        ).toFixed(2)
      );
    } else {
      const factor = value / 100;
      plant.aromaticOilStrength = Number(
        (plant.aromaticOilStrength * factor).toFixed(2)
      );
    }
    const saved = await this.plantRepo.save(plant);
    this.addLog(
      `Promijenjena jačina biljke "${saved.commonName}" (${before} → ${saved.aromaticOilStrength})`
    );
    if (saved.aromaticOilStrength > 4.0) {
      this.addLog(
        `⚠️ Upozorenje: jačina biljke "${saved.commonName}" prešla dozvoljenu granicu (4.00)`
      );
    }
    return toDTO(saved);
  }

  async harvestMany(
    commonName: string,
    count: number
  ): Promise<PlantDTO[]> {
    const available = await this.plantRepo.find({
      where: { commonName, status: PlantStatus.PLANTED },
      take: count,
    });

    if (available.length === 0) {
      throw new Error("No plants available");
    }

    for (const p of available) {
      p.status = PlantStatus.HARVESTED;
      await this.plantRepo.save(p);
    }

    this.addLog(
      `Ubrano ${available.length} biljaka vrste "${commonName}"`
    );

    return available.map(p => toDTO(p));
  }

  async markPlantsUsed(ids: number[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) return;

    const plants = await this.plantRepo.findBy({ id: In(ids) });

    for (const p of plants) {
      p.status = PlantStatus.PROCESSED;
      await this.plantRepo.save(p);
    }
    this.addLog(`Označeno ${plants.length} biljaka kao prerađene`);
  }

  async getAvailablePlants(count: number): Promise<PlantDTO[]> {
    const available = await this.plantRepo.find({
      where: { status: PlantStatus.PLANTED },
      take: count,
    });

    return available.map(p => toDTO(p));
  }

  async plantAndScale(sourceStrength: number): Promise<PlantDTO> {
    const deviation = Number((sourceStrength - 4.0).toFixed(2));
    const factor = deviation > 0 ? deviation : 1;

    const result = await this.plantNew({
      aromaticOilStrength: Number((sourceStrength * factor).toFixed(2)),
    });

    this.addLog(
      `Izvršena specijalna operacija plantAndScale (source: ${sourceStrength})`
    );

    return result;
  }

  async getProductionLogs(): Promise<{ time: string; message: string }[]> {
    return this.logs;
  }
}
