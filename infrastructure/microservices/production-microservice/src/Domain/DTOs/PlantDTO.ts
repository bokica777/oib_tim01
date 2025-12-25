import { Type } from "class-transformer";
import { IsOptional, IsString, IsNumber, Min, Max } from "class-validator";
import { PlantStatus } from "../enums/PlantStatus";

export class PlantDTO {
  @IsOptional()
  id?: number;

  @IsString()
  commonName!: string;

  @IsString()
  latinName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  aromaticOilStrength!: number;

  @IsString()
  countryOfOrigin!: string;

  @IsOptional()
  status?: PlantStatus;
}
