import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";

export interface IProcessingAPI {
  listAvailable(): Promise<PerfumeDTO[]>;
  getById(id: number): Promise<PerfumeDTO>;
  process(dto: ProcessRequestDTO): Promise<PerfumeDTO[]>;
  requestForPackaging(name: string, count: number): Promise<PerfumeDTO[]>;
}
