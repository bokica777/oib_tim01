import { Type } from "class-transformer";
import {IsArray, IsEnum, ValidateNested} from "class-validator";
import { PaymentType } from "../../enums/analysis/PaymentEnum";
import { SaleType } from "../../enums/analysis/ReceiptEnums";
import { CreateReceiptItemDTO } from "./CreateReceiptItemDTO";

export class CreateReceiptDTO {
  @IsEnum(SaleType)
  tipProdaje!: SaleType;

  @IsEnum(PaymentType)
  nacinPlacanja!: PaymentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptItemDTO)
  stavke!: CreateReceiptItemDTO[];
}
