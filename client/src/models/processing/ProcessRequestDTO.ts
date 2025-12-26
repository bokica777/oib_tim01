import { PerfumeType } from "../../enums/processing/PerfumeType"; 

export interface ProcessRequestDTO {
  perfumeName: string;
  type: PerfumeType;
  bottles: number;
  volumePerBottle: number; // 150 or 250
}
