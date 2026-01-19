import { Type } from "class-transformer";
import { IsString, IsInt, Min, ValidateNested, IsArray } from "class-validator";


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