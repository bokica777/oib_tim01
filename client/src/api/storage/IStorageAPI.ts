import { WarehouseDTO } from "../../models/storage/WarehouseDTO";
import { PackagingDTO } from "../../models/storage/PackagingDTO";
import { SendRequestDTO } from "../../models/storage/SendRequestDTO";
import { SendResponseDTO } from "../../models/storage/SendResponseDTO";

export interface IStorageAPI {
  listPackages(): Promise<PackagingDTO[]>;
  listWarehouses(): Promise<WarehouseDTO[]>;
  requestSend(req: SendRequestDTO): Promise<SendResponseDTO>;
}
