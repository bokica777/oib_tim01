import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { AuditRecord } from "../audit/AuditApi";

export interface IProcessingAPI {
  listPerfumes(): Promise<PerfumeDTO[]>;
  processPerfume(dto: ProcessRequestDTO): Promise<PerfumeDTO[]>;
  getLogs(token?: string): Promise<AuditRecord[]>;
}