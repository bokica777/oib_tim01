import { Type } from "class-transformer";
import { IsString, IsInt, Min, ValidateNested, IsArray } from "class-validator";
import { OrderItemDTO } from "./OrderItemDTO";

export class CreateOrderDTO {
  @IsString()
  customerName!: string;

  @IsString()
  deliveryAddress!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items!: OrderItemDTO[];
}
