import { PerfumeDTO } from "../DTOs/PerfumeDTO";
import { PerfumeType } from "../enums/PerfumeType";

export interface IProcessingService {
  processPerfume(perfumeName: string, type: PerfumeType, bottles: number, volumePerBottle: number): Promise<PerfumeDTO[]>;
  listAvailablePerfumes(): Promise<PerfumeDTO[]>;
  getPerfumeById(id: number): Promise<PerfumeDTO>;
  reservePerfumes(name: string, count: number): Promise<PerfumeDTO[]>;
}
