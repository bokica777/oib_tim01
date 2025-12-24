// src/Domain/services/IStorageCenter.ts
import { StoragePackage } from "../models/StoragePackage";

export interface IStorageCenter {

  send(count: number): Promise<StoragePackage[]>;
}
