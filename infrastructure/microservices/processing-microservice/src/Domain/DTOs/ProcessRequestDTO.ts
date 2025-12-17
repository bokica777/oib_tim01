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

  // allowed volumes 150 or 250 (we accept only 150 or 250; keep Min/Max and check allowed values)
  @Type(() => Number)
  @IsInt()
  @Min(150)
  @Max(250)
  volumePerBottle!: number;
}
