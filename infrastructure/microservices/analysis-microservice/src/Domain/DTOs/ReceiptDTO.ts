// src/Domain/dtos/ReceiptDtos.ts
import { PaymentType, SaleType } from "../models/Receipt";

// Jedna stavka koju klijent šalje
export interface CreateReceiptItemDto {
  parfemId: number;
  nazivParfema: string;
  kolicina: number;
  jedinicnaCena: number;
}

// Ceo račun koji se kreira
export interface CreateReceiptDto {
  tipProdaje: SaleType;      // "MALOPRODAJA" ili "VELEPRODAJA"
  nacinPlacanja: PaymentType; // "GOTOVINA" | "RACUN" | "KARTICA"
  stavke: CreateReceiptItemDto[];
}
