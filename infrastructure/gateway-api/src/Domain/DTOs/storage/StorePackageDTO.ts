import { IsString, IsOptional, IsArray, IsInt, Min } from "class-validator";

export class StorePackageDTO {
  @IsString()
  name!: string;

  @IsString()
  senderAddress!: string;

  @IsInt()
  @Min(1)
  warehouseId!: number;

  @IsOptional()
  @IsArray()
  perfumeIds?: number[];
}
