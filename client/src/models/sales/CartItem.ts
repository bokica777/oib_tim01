import { PerfumeDTO } from "./PerfumeDTO";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  product?: PerfumeDTO;
}
