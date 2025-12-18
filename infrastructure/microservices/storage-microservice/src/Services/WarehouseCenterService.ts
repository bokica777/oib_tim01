// src/Services/centers/WarehouseCenter.ts
import { Repository } from "typeorm";
import { StoragePackage } from "../Domain/models/StoragePackage";
import { PackageStatus } from "../Domain/enums/PackageStatus";
import { IStorageCenter } from "../Domain/services/IStorageService";


export class WarehouseCenter implements IStorageCenter {
  constructor(private readonly repo: Repository<StoragePackage>) {}

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async send(count: number): Promise<StoragePackage[]> {
    const out: StoragePackage[] = [];
    for (let i = 0; i < count; i++) {
      const candidates = await this.repo.find({
        where: { status: PackageStatus.PACKED },
        take: 1,
        order: { createdAt: "ASC" }
      });
      if (candidates.length === 0) break;
      const p = candidates[0];
      await this.sleep(2500);
      p.status = PackageStatus.SENT;
      await this.repo.save(p);
      out.push(p);
    }
    return out;
  }
}
