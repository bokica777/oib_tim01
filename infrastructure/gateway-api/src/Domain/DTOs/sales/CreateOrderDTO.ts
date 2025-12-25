import { IsString, IsInt, Min } from "class-validator";

export class CreateOrderDTO {
  @IsString()
  customerName!: string;

  @IsString()
  deliveryAddress!: string;

  @IsInt()
  @Min(1)
  count!: number;
}
