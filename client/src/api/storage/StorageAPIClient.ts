import axios, { AxiosInstance, AxiosError } from "axios";
import { IStorageAPI } from "./IStorageAPI";
import { PackagingDTO } from "../../models/storage/PackagingDTO";
import { SendRequestDTO } from "../../models/storage/SendRequestDTO";
import { SendResponseDTO } from "../../models/storage/SendResponseDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

export class StorageAPI implements IStorageAPI {
  private client: AxiosInstance;

  constructor() {
const base = (import.meta.env.VITE_GATEWAY_URL ?? "") + "/storage";


    this.client = axios.create({
      baseURL: base,
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token =
        localStorage.getItem("authToken") ??
        localStorage.getItem("token") ??
        localStorage.getItem("accessToken");

      if (token && cfg.headers) {
        cfg.headers.Authorization = `Bearer ${token}`;
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
  async listPackages(): Promise<PackagingDTO[]> {
    const res = await this.client.get<any[]>("/packages");
    const data = res.data ?? [];
    return data.map(this.mapPackage);
  }

  async listWarehouses(): Promise<WarehouseDTO[]> {
    const res = await this.client.get<any[]>("/warehouses");
    return (res.data ?? []).map(this.mapWarehouse); 
  }
  async requestSend(dto: SendRequestDTO): Promise<SendResponseDTO> {
    const res = await this.client.post<SendResponseDTO>("/send", dto);
    return res.data;
  }
  private mapPackage(p: any): PackagingDTO {
    return {
      id: String(p.id ?? p.serialNumber ?? ""),
      code: p.serialNumber ?? p.code ?? `pkg-${p.id ?? ""}`,
      count: Number(p.count ?? p.quantity ?? 1),
      warehouseId: String(p.warehouseId ?? p.warehouse?.id ?? ""),
      status: (p.status ?? "STORED") as "STORED" | "SENT" | "PACKED",
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

export const storageAPI = new StorageAPI();
