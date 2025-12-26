// src/api/plant/IPlantAPI.ts
import { Plant } from "../../types/Plant";

export interface IPlantAPI {
  // 🌿 Dohvat dostupnih biljaka
  getPlants(token: string, count?: number): Promise<Plant[]>;

  // 🌱 Sadnja nove biljke
  plantNew(plant: Partial<Plant>, token: string): Promise<Plant>;

  // ⚖️ Balans arome (processing → production)
  plantAndScale(
    sourceStrength: number,
    factor: number,
    token: string
  ): Promise<Plant>;
}
