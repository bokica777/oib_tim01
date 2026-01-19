import { Type } from "class-transformer";
import { IsString, IsNumber, Min, Max, IsEnum, IsInt } from "class-validator";
import { PerfumeType } from "../enums/PerfumeType";

export class ProcessRequestDTO {
  @IsString()
  perfumeName!: string;

  @IsEnum(PerfumeType)
  type!: PerfumeType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  bottles!: number;
  
  @Type(() => Number)
  @IsInt()
  @Min(150)
  @Max(250)
  volumePerBottle!: number;
}
