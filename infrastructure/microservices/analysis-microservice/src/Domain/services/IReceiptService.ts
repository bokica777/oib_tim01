import { Receipt } from "../models/Receipt";
import { CreateReceiptDto } from "../DTOs/ReceiptDTO";

export interface IReceiptService {
  createReceipt(dto: CreateReceiptDto): Promise<Receipt>;

  getAllReceipts(): Promise<Receipt[]>;

  getDailyRevenue(date: string): Promise<number>;

  getSalesByProduct(): Promise<any[]>;
}

