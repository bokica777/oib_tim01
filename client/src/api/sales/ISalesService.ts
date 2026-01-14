import { PerfumeDTO } from "../../models/sales/PerfumeDTO";
import { CreateOrderDTO } from "../../models/sales/CreateOrderDTO";

export interface ISalesService {
  listPerfumes(): Promise<PerfumeDTO[]>;
  createOrder(dto: CreateOrderDTO): Promise<any>;
  getOrderById?(id: number): Promise<any>;
  listOrders?(): Promise<any[]>;
}
