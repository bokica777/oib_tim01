export interface ProcessingPerfumeDTO {
  id: number;
  name: string;
  type: "PERFUME" | "COLOGNE";
  netVolumeMl: number;
  serialNumber?: string;
  sourcePlantIds?: number[];
  expirationDate?: string;
  status?: string;
  createdAt?: string;
}
