import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { OrderItemDTO } from "./OrderItemDTO";

export enum PaymentType {
  GOTOVINA = "GOTOVINA",
  RACUN = "RACUN",
  KARTICA = "KARTICA",
}

export class CreateOrderDTO {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items!: OrderItemDTO[];

  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalPrice!: number;
}
