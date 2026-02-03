import axios, { AxiosError, AxiosInstance } from "axios";
import { PackagingDTO } from "../../models/storage/PackagingDTO";
import { SendRequestDTO } from "../../models/storage/SendRequestDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type StoragePackageApiDTO = {
  id: number;
  name: string;
  senderAddress: string;
  warehouseId: number;
  perfumeIds: number[];
  status: "PACKED" | "SENT" | "STORED";
  serialNumber?: string;
  createdAt?: string;
};

export class StorageAPI {
  private client: AxiosInstance;

  constructor() {
    const apiBase = (import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000/api/v1")
      .replace(/\/+$/, "");

    this.client = axios.create({
      baseURL: apiBase,
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        console.error("[StorageAPI] Axios error:", error.message, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  async listPackages(status?: "PACKED" | "SENT" | "STORED"): Promise<PackagingDTO[]> {
    const res = await this.client.get<StoragePackageApiDTO[]>("/storage/packages", {
      params: status ? { status } : undefined,
    });

    return (res.data ?? []).map(this.mapPackage);
  }

  async listWarehouses(): Promise<WarehouseDTO[]> {
    const res = await this.client.get<any[]>("/storage/warehouses");
    return (res.data ?? []).map(this.mapWarehouse);
  }

  async requestSend(dto: SendRequestDTO): Promise<any> {
    const res = await this.client.post("/storage/send", dto);
    return res.data;
  }

  async storePackage(dto: {
    name: string;
    senderAddress: string;
    warehouseId: number;
    perfumeIds: number[];
  }): Promise<any> {
    const res = await this.client.post("/storage/store", dto);
    return res.data;
  }

  private mapPackage = (p: StoragePackageApiDTO): PackagingDTO => {
    const ids = Array.isArray(p.perfumeIds) ? p.perfumeIds : [];

    return {
      id: String(p.id),
      code: p.serialNumber ?? `PKG-${p.id}`,
      perfumeId: ids.join(","),
      perfumeName: undefined,
      volumeMl: undefined,
      warehouseId: String(p.warehouseId),
      status: p.status,
      createdAt: p.createdAt,
      count: ids.length,
    };
  };

  private mapWarehouse = (w: any): WarehouseDTO => ({
    id: String(w.id ?? ""),
    name: w.name ?? `Skladište ${w.id ?? ""}`,
    location: w.location ?? undefined,
    capacity: Number(w.capacity ?? 0),
    capacityUsed: Number(w.capacityUsed ?? w.usedCapacity ?? 0),
  });
}

export const storageAPI = new StorageAPI();
