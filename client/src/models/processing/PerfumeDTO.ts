import { PerfumeStatus } from "../../enums/processing/PerfumeStatus";
export type PerfumeDTO = {
  id: string;
  name: string;
  volume: number; 
  count: number;
  status?: PerfumeStatus;
  createdAt?: string;
  price?: number; 
};
