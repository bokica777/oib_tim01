import { Type } from "class-transformer";
import { IsInt, Min, IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @IsString()
  name?: string;
}
