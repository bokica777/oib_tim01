import { Type } from "class-transformer";
import { IsString, IsArray, ValidateNested, IsInt, Min } from "class-validator";
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
