import { Type } from "class-transformer";
import { IsString, IsOptional, IsInt, Min } from "class-validator";

export class StorePackageDTO {
  @IsString()
  name!: string;

  @IsString()
  senderAddress!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouseId!: number;

  // one perfume id per package (spec requires one perfume per package)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  perfumeId?: number;
}
