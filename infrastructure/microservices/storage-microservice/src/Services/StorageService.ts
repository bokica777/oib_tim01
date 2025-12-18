import { Repository } from "typeorm";
import { StoragePackage } from "../Domain/models/StoragePackage";
import { PackageStatus } from "../Domain/enums/PackageStatus";
import { IStorageCenter } from "../Domain/services/IStorageService";

export class StorageService {
  constructor(
    private readonly pkgRepo: Repository<StoragePackage>,
    private readonly distributiveCenter: IStorageCenter,
    private readonly warehouseCenter: IStorageCenter
  ) {}

  async storePackage(data: Partial<StoragePackage>): Promise<StoragePackage> {
    // per spec: when package is stored/packed it should be PACKED so it is eligible for sending
    const p = this.pkgRepo.create({ ...data, status: PackageStatus.PACKED });
    const saved = await this.pkgRepo.save(p);
    saved.serialNumber = `PKG-2025-${saved.id}`;
    return this.pkgRepo.save(saved);
  }

  async sendPackagesForRole(role: string | undefined, count: number): Promise<StoragePackage[]> {
    if (role === "SALES_MANAGER") {
      return await this.distributiveCenter.send(count);
    }
    return await this.warehouseCenter.send(count);
  }

  async listAvailable(): Promise<StoragePackage[]> {
    return this.pkgRepo.find({ where: { status: PackageStatus.PACKED }, order: { createdAt: "ASC" }});
  }
}
