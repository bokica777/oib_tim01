export interface CreateOrderItemDTO {
  perfumeId: number;
  quantity: number;
}

export interface CreateOrderDTO {
  customerName: string;
  deliveryAddress?: string;
  items: CreateOrderItemDTO[];
  note?: string;
  contactPhone?: string;
}
