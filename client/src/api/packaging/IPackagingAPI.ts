import { StoragePackageDTO } from "../../models/storage/StoragePackageDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";
export interface IPackagingAPI {
  listPackages(): Promise<StoragePackageDTO[]>;
  listWarehouses(): Promise<WarehouseDTO[]>;
  requestSend(count: number): Promise<any>;
  requestPacking(payload: { name?: string; count: number; warehouseId?: number }): Promise<StoragePackageDTO[]>;
}