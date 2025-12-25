import { PlantDTO } from "../DTOs/PlantDTO";

export interface IProductionService {
  // 1️⃣ Sadnja nove biljke
  plantNew(seedData?: Partial<PlantDTO>): Promise<PlantDTO>;

  // 2️⃣ Povećanje ili skaliranje jačine aromatičnog ulja
  adjustAromaticStrength(
    plantId: number,
    value: number,
    mode?: "inc" | "scale"
  ): Promise<PlantDTO>;

  // 3️⃣ Berba više biljaka istog tipa
  harvestMany(
    commonName: string,
    count: number
  ): Promise<PlantDTO[]>;

  // 4️⃣ Dobavljanje dostupnih (posađenih) biljaka
  getAvailablePlants(
    count: number
  ): Promise<PlantDTO[]>;

  // 5️⃣ Označavanje biljaka kao iskorištene (prerađene)
  markPlantsUsed(
    ids: number[]
  ): Promise<void>;

  // 6️⃣ Specijalna operacija za preradu (sadnja + skaliranje jačine)
  plantAndScale(
    sourceStrength: number,
    factor?: number
  ): Promise<PlantDTO>;

  // 7️⃣ Dnevnik proizvodnje
  getProductionLogs(): Promise<
    {
      time: string;
      message: string;
    }[]
  >;
}
