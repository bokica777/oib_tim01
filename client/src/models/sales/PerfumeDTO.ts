export interface PerfumeDTO {
  id: number;
  name: string;
  price: number;   
  stock: number;   
  netVolumeMl?: number;
  description?: string;
  sku?: string;
  imageUrl?: string;
}
