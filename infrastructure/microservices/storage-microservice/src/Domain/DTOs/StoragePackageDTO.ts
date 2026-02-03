import { Transform, Type } from "class-transformer";
import { IsString, IsOptional, IsInt, Min, IsNotEmpty, ArrayNotEmpty, IsArray } from "class-validator";

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

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  perfumeIds!: number[];

}