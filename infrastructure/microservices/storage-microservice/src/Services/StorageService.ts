import { Repository } from "typeorm";
import { StoragePackage } from "../Domain/models/StoragePackage";
import { PackageStatus } from "../Domain/enums/PackageStatus";
import { IStorageCenter } from "../Domain/services/IStorageService";
import { Warehouse } from "../Domain/models/Warehouse";
import { Db } from "../Database/DbConnectionPool";

export class StorageService {
  constructor(
    private readonly pkgRepo: Repository<StoragePackage>,
    private readonly distributiveCenter: IStorageCenter,
    private readonly warehouseCenter: IStorageCenter
  ) {}

  async storePackage(data: Partial<StoragePackage>): Promise<StoragePackage> {
    if (!data.warehouseId) {
      throw new Error("warehouseId is required");
    }

    const warehouseRepo = Db.getRepository(Warehouse);
    const warehouse = await warehouseRepo.findOneBy({ id: data.warehouseId });
    if (!warehouse) {
      throw new Error("Skladište ne postoji");
    }

    if (warehouse.usedCapacity >= warehouse.capacity) {
      throw new Error("Skladište je puno");
    }

    const p = this.pkgRepo.create({
      ...data,
      status: PackageStatus.PACKED,
    });

    const saved = await this.pkgRepo.save(p);

    saved.serialNumber = `PKG-2025-${saved.id}`;
    await this.pkgRepo.save(saved);

    warehouse.usedCapacity += 1;
    await warehouseRepo.save(warehouse);

    return saved;
  }

  async sendPackagesForRole(
    role: string | undefined,
    count: number
  ): Promise<StoragePackage[]> {
    if (role === "SALES_MANAGER") {
      return this.distributiveCenter.send(count);
    }
    return this.warehouseCenter.send(count);
  }

  async listAvailable(): Promise<StoragePackage[]> {
    return this.pkgRepo.find({
      where: { status: PackageStatus.PACKED },
      order: { createdAt: "ASC" },
    });
  }

  async listWarehouses(): Promise<Warehouse[]> {
    const warehouseRepo = Db.getRepository(Warehouse);
    return warehouseRepo.find({
      order: { name: "ASC" },
    });
  }
}
