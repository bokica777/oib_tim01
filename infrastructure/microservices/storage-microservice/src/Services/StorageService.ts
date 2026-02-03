import { Repository } from "typeorm";
import { StoragePackage } from "../Domain/models/StoragePackage";
import { PackageStatus } from "../Domain/enums/PackageStatus";
import { IStorageCenter } from "../Domain/services/IStorageService";
import { Warehouse } from "../Domain/models/Warehouse";
import { Db } from "../Database/DbConnectionPool";
import { In } from "typeorm";

export class StorageService {
  constructor(
    private readonly pkgRepo: Repository<StoragePackage>,
    private readonly distributiveCenter: IStorageCenter,
    private readonly warehouseCenter: IStorageCenter
  ) { }

  async storePackage(data: { name: string; senderAddress: string; warehouseId: number; perfumeIds: number[] }): Promise<StoragePackage> {
    if (!data.warehouseId) throw new Error("warehouseId is required");

    const warehouseRepo = Db.getRepository(Warehouse);
    const warehouse = await warehouseRepo.findOneBy({ id: data.warehouseId });
    if (!warehouse) throw new Error("Skladište ne postoji");

    if (warehouse.usedCapacity >= warehouse.capacity) {
      throw new Error("Skladište je puno");
    }

    const p = this.pkgRepo.create({
      name: data.name,
      senderAddress: data.senderAddress,
      warehouseId: data.warehouseId,
      perfumeIds: Array.isArray(data.perfumeIds) ? data.perfumeIds : [],
      status: PackageStatus.PACKED,
    });

    const saved = await this.pkgRepo.save(p);

    saved.serialNumber = `PKG-2025-${saved.id}`;
    await this.pkgRepo.save(saved);

    await warehouseRepo.increment({ id: warehouse.id }, "usedCapacity", 1);

    return saved;
  }

  async sendPackagesForRole(
    role: string | undefined,
    count: number
  ): Promise<StoragePackage[]> {
    const r = (role ?? "").toLowerCase();

    const sent =
      r === "sales_manager"
        ? await this.distributiveCenter.send(count)
        : await this.warehouseCenter.send(count);

    const warehouseRepo = Db.getRepository(Warehouse);
    const byWh = new Map<number, number>();

    for (const p of sent) {
      byWh.set(p.warehouseId, (byWh.get(p.warehouseId) ?? 0) + 1);
    }

    for (const [warehouseId, dec] of byWh) {
      await warehouseRepo.decrement({ id: warehouseId }, "usedCapacity", dec);
    }

    return sent;
  }

  async listAvailable(status?: PackageStatus): Promise<StoragePackage[]> {
    if (status) {
      return this.pkgRepo.find({ where: { status }, order: { createdAt: "ASC" } });
    }

    return this.pkgRepo.find({
      where: { status: In([PackageStatus.PACKED, PackageStatus.SENT]) },
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
