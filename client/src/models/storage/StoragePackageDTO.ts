export type StoragePackageDTO = {
  id: string;
  name: string;
  senderAddress: string;
  warehouseId: string;
  perfumeId?: number;
  perfumeIds?: number[];
  status?: "PACKED" | "SENT" | "STORED";
  serialNumber?: string;
  createdAt?: string;
  volume?:number;
};
