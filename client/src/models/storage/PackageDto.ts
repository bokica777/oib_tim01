export type PackageDto = {
  id?: number;
  name: string;
  senderAddress: string;
  warehouseId: number;
  perfumeIds?: number[];
  serialNumber?: string;
  status?: string;
  createdAt?: string;
};