import { PlantDTO } from "../DTOs/PlantDTO";

export interface IProductionService {
  plantNew(seedData?: Partial<PlantDTO>): Promise<PlantDTO>;
  adjustAromaticStrength(plantId: number, percent: number): Promise<PlantDTO>;
  harvestMany(commonName: string, count: number): Promise<PlantDTO[]>;
}
