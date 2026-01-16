import { Type } from "class-transformer";
import { IsString, IsArray, ValidateNested, IsIn } from "class-validator";
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

  @IsString()
  @IsIn(["cash", "bank", "card"])
  paymentType!: "cash" | "bank" | "card"; // <= DODATO (obavezno polje)
}
