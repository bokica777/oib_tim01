import { Plant } from "../../types/Plant";

export interface IPlantAPI {
  getPlants(token: string, count?: number): Promise<Plant[]>;
  plantNew(plant: Partial<Plant>, token: string): Promise<Plant>;
  plantAndScale(
    sourceStrength: number,
    factor: number,
    token: string
  ): Promise<Plant>;
}
