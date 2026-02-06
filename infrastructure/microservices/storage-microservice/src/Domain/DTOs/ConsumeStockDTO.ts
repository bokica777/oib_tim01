import { Type } from "class-transformer";
import { IsArray, ArrayNotEmpty, ValidateNested, IsInt, Min, IsOptional, IsString } from "class-validator";

export class ConsumeItemDTO {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perfumeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ConsumeStockDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ConsumeItemDTO)
  items!: ConsumeItemDTO[];

  @IsOptional()
  @IsString()
  orderSerial?: string;
}
