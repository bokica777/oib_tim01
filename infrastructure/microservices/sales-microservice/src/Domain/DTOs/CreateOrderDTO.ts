import { Type } from "class-transformer";
import { IsString, IsInt, Min } from "class-validator";

export class CreateOrderDTO {
  @IsString()
  customerName!: string;

  @IsString()
  deliveryAddress!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  count!: number;
}
