import { PaymentType, SaleType } from "../models/Receipt";

export interface CreateReceiptItemDto {
  parfemId: number;
  nazivParfema: string;
  kolicina: number;
  jedinicnaCena: number;
}

// Ceo račun koji se kreira
export interface CreateReceiptDto {
  tipProdaje: SaleType;    
  nacinPlacanja: PaymentType; 
  stavke: CreateReceiptItemDto[];
}
