// src/Services/centers/DistributiveCenter.ts
import { Repository } from "typeorm";
import { StoragePackage } from "../Domain/models/StoragePackage";
import { PackageStatus } from "../Domain/enums/PackageStatus";
import { IStorageCenter } from "../Domain/services/IStorageService";


export class DistributiveCenter implements IStorageCenter {
  constructor(private readonly repo: Repository<StoragePackage>) {}

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async send(count: number): Promise<StoragePackage[]> {
    const out: StoragePackage[] = [];
    while (out.length < count) {
      const toTake = Math.min(3, count - out.length);
      const candidates = await this.repo.find({
        where: { status: PackageStatus.PACKED },
        take: toTake,
        order: { createdAt: "ASC" }
      });
      if (candidates.length === 0) break;
      for (const p of candidates) {
        await this.sleep(500);
        p.status = PackageStatus.SENT;
        await this.repo.save(p);
        out.push(p);
      }
    }
    return out;
  }
}
