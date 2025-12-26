import { PerfumeStatus } from "../../enums/processing/PerfumeStatus";
import { PerfumeType } from "../../enums/processing/PerfumeType";

export interface PerfumeDTO {
  id?: number;
  name: string;
  type: PerfumeType;
  netVolumeMl: number;
  serialNumber?: string;
  sourcePlantIds?: number[];
  expirationDate?: string; // ISO string
  status?: PerfumeStatus;
  createdAt?: string; // ISO string
}