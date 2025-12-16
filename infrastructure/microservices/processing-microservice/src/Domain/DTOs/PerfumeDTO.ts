import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsArray, IsDateString,} from "class-validator";
import { PerfumeType } from "../enums/PerfumeType"; 
import { PerfumeStatus } from "../enums/PerfumeStatus";

export class PerfumeDTO {
  @IsOptional()
  id?: number;

  @IsString()
  name!: string;

  @IsEnum(PerfumeType)
  type!: PerfumeType;

  @IsNumber()
  @Min(1)
  @Max(5000)
  netVolumeMl!: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sourcePlantIds?: number[];

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsEnum(PerfumeStatus)
  status?: PerfumeStatus;
}
