import { Transform } from "class-transformer";
import { IsString, IsOptional, IsInt, Min, IsNotEmpty } from "class-validator";

export class StorePackageDTO {
  @IsString()
  @IsNotEmpty({ message: "name is required" })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "senderAddress is required" })
  senderAddress!: string;
  
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === "") return value;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  }, { toClassOnly: true })
  @IsInt({ message: "warehouseId must be an integer" })
  @Min(1, { message: "warehouseId must be >= 1" })
  warehouseId!: number;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  }, { toClassOnly: true })
  @IsOptional()
  @IsInt({ message: "perfumeId must be an integer" })
  perfumeId?: number;
}