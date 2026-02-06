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

  async consumeForSale(
    items: { perfumeId: number; quantity: number }[],
    orderSerial?: string
  ): Promise<void> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("items is required");
    }

    const normalized = items.map(i => ({
      perfumeId: Number(i.perfumeId),
      quantity: Math.max(1, Number(i.quantity) || 1),
    }));

    if (normalized.some(x => !Number.isFinite(x.perfumeId) || x.perfumeId <= 0)) {
      throw new Error("Invalid perfumeId in items");
    }

    const sentPackages = await this.pkgRepo.find({
      where: { status: PackageStatus.SENT },
      order: { createdAt: "ASC" },
    });

    const available: Record<number, number> = {};
    for (const p of sentPackages) {
      const ids = Array.isArray(p.perfumeIds) ? p.perfumeIds : [];
      for (const raw of ids) {
        const id = Number(raw);
        if (!Number.isFinite(id) || id <= 0) continue;
        available[id] = (available[id] || 0) + 1;
      }
    }

    for (const it of normalized) {
      const have = available[it.perfumeId] || 0;
      if (have < it.quantity) {
        const e: any = new Error(
          `Nema dovoljno stock-a za perfumeId=${it.perfumeId} (ima ${have}, treba ${it.quantity})`
        );
        e.status = 409;
        throw e;
      }
    }

    for (const it of normalized) {
      let remaining = it.quantity;

      for (const pkg of sentPackages) {
        if (remaining <= 0) break;

        const ids = Array.isArray(pkg.perfumeIds) ? [...pkg.perfumeIds] : [];
        let changed = false;

        for (let i = ids.length - 1; i >= 0 && remaining > 0; i--) {
          if (Number(ids[i]) === it.perfumeId) {
            ids.splice(i, 1);
            remaining--;
            changed = true;
          }
        }

        if (changed) {
          pkg.perfumeIds = ids;

          if (ids.length === 0) {
            pkg.status = PackageStatus.SOLD;
            if (orderSerial) pkg.name = `${pkg.name} [SOLD:${orderSerial}]`;
          }

          await this.pkgRepo.save(pkg);
        }
      }
    }
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