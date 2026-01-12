export interface OrderItemDTO {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock?: number; 
}
