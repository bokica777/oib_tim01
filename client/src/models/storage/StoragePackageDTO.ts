import { PackageStatus } from "../../enums/PackageStatus";

export type StoragePackageDTO = {
  id: string;
  name: string;
  senderAddress: string;
  warehouseId: string;
  perfumeId: number;            
  status: PackageStatus;
  serialNumber?: string;
  volume? :number;
  createdAt?: string;
};
