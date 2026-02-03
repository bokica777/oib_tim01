export type PackageStatus = "PACKED" | "SENT";

export type StoragePackageDTO = {
  id: string;
  name: string;
  senderAddress: string;
  warehouseId: string;
  perfumeIds: number[];            
  status: PackageStatus;
  serialNumber?: string;
  createdAt?: string;
};
