import { PerfumeStatus } from "../../enums/processing/PerfumeStatus";
export type PerfumeDTO = {
  id: string;
  name: string;
  volume: number; // ml
  count: number;
  status?: PerfumeStatus;
  createdAt?: string;
};
