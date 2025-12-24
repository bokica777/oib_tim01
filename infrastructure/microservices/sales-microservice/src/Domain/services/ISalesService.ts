import { SaleOrder } from "../models/SaleOrder";

export interface ISalesService {
  createOrder(customerName: string, deliveryAddress: string, count: number, role?: string): Promise<SaleOrder>;
  getOrderById(id: number): Promise<SaleOrder>;
  listOrders(): Promise<SaleOrder[]>;
}
