import { OrderItemDTO } from "./OrderItemDTO";

export interface CreateOrderDTO {
  customerName: string;
  deliveryAddress?: string;
  packagesRequested: number;
  items: OrderItemDTO[];
  note?: string;
  contactPhone?: string;
  role?: string;
}
