// src/Services/ProductionService.ts
import { Repository, In } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { IProductionService } from "../Domain/services/IProductionService";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";

type ProductionLogItem = {
  time: string;
  message: string;
};

export class ProductionService implements IProductionService {
  constructor(private readonly plantRepo: Repository<Plant>) {}

  // 🔹 IN-MEMORY DNEVNIK (NAMJERNO JEDNOSTAVNO)
  private logs: ProductionLogItem[] = [];

  private addLog(message: string) {
    this.logs.unshift({
      time: new Date().toISOString(),
      message,
    });
  }

  private toDTO(p: Plant): PlantDTO {
    return {
      id: p.id,
      commonName: p.commonName,
      latinName: p.latinName,
      aromaticOilStrength: p.aromaticOilStrength,
      countryOfOrigin: p.countryOfOrigin,
      status: p.status,
    };
  }

  // 1️⃣ Sadnja nove biljke
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

    // 📝 LOG
    this.addLog(
      `Zasađena biljka "${saved.commonName}" (jačina: ${saved.aromaticOilStrength})`
    );

    return this.toDTO(saved);
  }

  // 2️⃣ Promjena jačine aromatičnog ulja
async adjustAromaticStrength(
  plantId: number,
  value: number,
  mode: "inc" | "scale" = "inc"
): Promise<PlantDTO> {
  const plant = await this.plantRepo.findOne({ where: { id: plantId } });
  if (!plant) throw new Error("Plant not found");

  const before = plant.aromaticOilStrength;

  if (mode === "inc") {
    // value je PROCENAT (npr 10 ili -10)
    const multiplier = value / 100;
    plant.aromaticOilStrength = Number(
      (
        plant.aromaticOilStrength +
        plant.aromaticOilStrength * multiplier
      ).toFixed(2)
    );
  } else {
    // scale → value je PROCENAT (npr 65)
    const factor = value / 100;
    plant.aromaticOilStrength = Number(
      (plant.aromaticOilStrength * factor).toFixed(2)
    );
  }

  // ✅ SNIMI PROMJENU U BAZU
  const saved = await this.plantRepo.save(plant);

  // 📝 LOG PROMJENE
  this.addLog(
    `Promijenjena jačina biljke "${saved.commonName}" (${before} → ${saved.aromaticOilStrength})`
  );

  // ⚠️ UPOZORENJE AKO PREĐE 4.00
  if (saved.aromaticOilStrength > 4.0) {
    this.addLog(
      `⚠️ Upozorenje: jačina biljke "${saved.commonName}" prešla dozvoljenu granicu (4.00)`
    );
  }

  // ✅ VRATI DTO (DA SE FRONTEND AŽURIRA)
  return this.toDTO(saved);
}


  // 3️⃣ Berba biljaka
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

    // 📝 LOG
    this.addLog(
      `Ubrano ${available.length} biljaka vrste "${commonName}"`
    );

    return available.map(p => this.toDTO(p));
  }

  // 4️⃣ Označavanje biljaka kao prerađene
  async markPlantsUsed(ids: number[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) return;

    const plants = await this.plantRepo.findBy({ id: In(ids) });

    for (const p of plants) {
      p.status = PlantStatus.PROCESSED;
      await this.plantRepo.save(p);
    }

    // 📝 LOG
    this.addLog(`Označeno ${plants.length} biljaka kao prerađene`);
  }

  // 5️⃣ Dohvatanje dostupnih biljaka
  async getAvailablePlants(count: number): Promise<PlantDTO[]> {
    const available = await this.plantRepo.find({
      where: { status: PlantStatus.PLANTED },
      take: count,
    });

    return available.map(p => this.toDTO(p));
  }

  // 6️⃣ Specijalna proizvodna operacija
  async plantAndScale(sourceStrength: number): Promise<PlantDTO> {
    const deviation = Number((sourceStrength - 4.0).toFixed(2));
    const factor = deviation > 0 ? deviation : 1;

    const result = await this.plantNew({
      aromaticOilStrength: Number((sourceStrength * factor).toFixed(2)),
    });

    // 📝 LOG
    this.addLog(
      `Izvršena specijalna operacija plantAndScale (source: ${sourceStrength})`
    );

    return result;
  }

  // 7️⃣ Dnevnik proizvodnje
  async getProductionLogs(): Promise<{ time: string; message: string }[]> {
    return this.logs;
  }
}
