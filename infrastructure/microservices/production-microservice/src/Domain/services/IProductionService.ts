import { PlantDTO } from "../DTOs/PlantDTO";

export interface IProductionService {
  plantNew(seedData?: Partial<PlantDTO>): Promise<PlantDTO>;
  adjustAromaticStrength(
  plantId: number,
  value: number,
  mode?: "inc" | "scale",
  commonName?: string
): Promise<PlantDTO>;
  harvestMany(
    commonName: string,
    count: number
  ): Promise<PlantDTO[]>;
  getAvailablePlants(
    count: number
  ): Promise<PlantDTO[]>;

  markPlantsUsed(
    ids: number[]
  ): Promise<void>;

  plantAndScale(
    sourceStrength: number,
    factor?: number
  ): Promise<PlantDTO>;

  getProductionLogs(): Promise<
    {
      time: string;
      message: string;
    }[]
  >;
}
