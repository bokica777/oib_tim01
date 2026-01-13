import { PerfumeType } from "../../enums/processing/PerfumeType";

export type ProcessRequestDTO = {
  perfumeName: string;
  type: PerfumeType;
  bottles: number;
  volumePerBottle: 150|250;
};
