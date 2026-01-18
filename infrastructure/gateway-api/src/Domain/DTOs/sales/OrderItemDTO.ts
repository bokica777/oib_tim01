import { Type } from "class-transformer";
import { IsString, IsArray, ValidateNested, IsInt, Min } from "class-validator";

export class OrderItemDTO {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perfumeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  price!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}