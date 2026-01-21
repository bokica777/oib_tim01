import { PerfumeType } from "../../enums/processing/PerfumeType";

export interface PerfumeDTO {
  id: number;
  name: string;
  price: number;   
  stock: number;   
  netVolumeMl?: number;
  description?: string;
  sku?: string;
  imageUrl?: string;
  type: PerfumeType;
}
