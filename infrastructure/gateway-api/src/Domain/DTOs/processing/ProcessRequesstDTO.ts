import { IsString, IsEnum, IsInt, Min, Max } from "class-validator";
import { PerfumeType } from "../../enums/processing/PerfumeType"; 

export class ProcessRequestDTO {
  @IsString()
  perfumeName!: string;

  @IsEnum(PerfumeType)
  type!: PerfumeType;

  @IsInt()
  @Min(1)
  bottles!: number;

  @IsInt()
  @Min(150)
  @Max(250)
  volumePerBottle!: number;
}
