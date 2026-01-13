import axios, { AxiosInstance, AxiosError } from "axios";
import { StoragePackageDTO } from "../../models/storage/StoragePackageDTO"; 
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";
import { IPackagingAPI } from "./IPackagingAPI"; 


export class PackagingAPI implements IPackagingAPI {
  private client: AxiosInstance;

  constructor() {
    const gateway = import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000";
    const base = gateway+"/api/v1";

    this.client = axios.create({
      baseURL: base,
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token =localStorage.getItem("accessToken");

      const headers = cfg.headers as any;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        console.error("[PackagingAPI] Axios error:", error.message, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async listPackages(): Promise<StoragePackageDTO[]> {
    const res = await this.client.get<any[]>("/storage/packages");
    const data = res.data ?? [];
    return data.map(this.mapPackage);
  }

  async listWarehouses(): Promise<WarehouseDTO[]> {
    const res = await this.client.get<any[]>("/storage/warehouses");
    return (res.data ?? []).map(this.mapWarehouse);
  }

  async requestSend(count: number): Promise<any> {
    const res = await this.client.post("/storage/send", { count });
    return res.data;
  }

    async requestPacking(payload: { name?: string; count: number; warehouseId?: number }): Promise<StoragePackageDTO[]> {
    const res = await this.client.post<any[]>("/packaging/pack", payload);
    const data = res.data ?? [];
    return data.map(this.mapPackage);
  }

  private mapPackage(p: any): StoragePackageDTO {
    return {
      id: String(p.id ?? p.serialNumber ?? ""),
      name: p.name ?? `Package ${p.id ?? ""}`,
      senderAddress: p.senderAddress ?? p.sender ?? "",
      warehouseId: String(p.warehouseId ?? p.warehouse?.id ?? ""),
      perfumeIds: Array.isArray(p.perfumeIds) ? p.perfumeIds.map((x: any) => Number(x)) : undefined,
      status: (p.status ?? "PACKED") as "PACKED" | "SENT" | "STORED",
      serialNumber: p.serialNumber ?? undefined,
      createdAt: p.createdAt ? String(p.createdAt) : undefined,
    };
  }

  private mapWarehouse(w: any): WarehouseDTO {
    return {
      id: String(w.id ?? ""),
      name: w.name ?? `Skladište ${w.id ?? ""}`,
      location: w.location ?? w.address ?? undefined,
      capacity: Number(w.capacity ?? w.capacityTotal ?? 0),
      capacityUsed: Number(w.usedCapacity ?? w.capacityUsed ?? 0),
    };
  }
}

export const packagingAPI = new PackagingAPI();
export default packagingAPI;
