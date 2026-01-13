// src/api/processing/ProcessingAPI.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";
import { PerfumeStatus } from "../../enums/processing/PerfumeStatus";
import auditAPI from "../audit/AuditApi";
import { AuditRecord } from "../audit/AuditApi";
import { IProcessingAPI } from "./IProcessingAPI";

export class ProcessingAPI implements IProcessingAPI{
  private client: AxiosInstance;

  constructor() {
    const gateway = (import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000").replace(/\/+$/, "");
    const base = `${gateway}/processing`;

    this.client = axios.create({
      baseURL: base,
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("accessToken");
      const headers = cfg.headers as any;
      if (token) headers.Authorization = `Bearer ${token}`;
      return cfg;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        console.error("[ProcessingAPI] Axios error:", error.message, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  private mapPerfume(p: any): PerfumeDTO {
    return {
      id: String(p.id ?? `${p.name}-${p.netVolumeMl}`),
      name: p.name,
      volume: Number(p.netVolumeMl ?? p.volume ?? p.netVolume ?? 0),
      count: 1,
      status: (p.status ?? PerfumeStatus.AVAILABLE) as PerfumeStatus,
      createdAt: p.createdAt,
    };
  }

  async listPerfumes(): Promise<PerfumeDTO[]> {
    const res = await this.client.get<any[]>("/perfumes");
    const map = new Map<string, PerfumeDTO>();

    for (const p of res.data ?? []) {
      const key = `${p.name}-${p.netVolumeMl ?? p.volume ?? ""}`;
      const item = this.mapPerfume(p);
      if (map.has(key)) {
        map.get(key)!.count += 1;
      } else {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  }

  async processPerfume(dto: ProcessRequestDTO): Promise<PerfumeDTO[]> {
    try {
      const res = await this.client.post<any[]>("/process", dto);
      const out = (res.data ?? []).map((p) => this.mapPerfume(p));

      // audit: success
      try {
        await auditAPI.createLog({
          type: "INFO",
          message: `Prerada uspešna: ${dto.bottles} x ${dto.perfumeName} ${dto.volumePerBottle}ml`,
          source: "processing",
          meta: { dto, producedCount: out.length },
        });
      } catch { /* ignore auditing failure */ }

      return out;
    } catch (err: any) {
      // audit: error
      try {
        await auditAPI.createLog({
          type: "ERROR",
          message: `Greška pri preradi: ${dto.perfumeName} — ${(err?.response?.data?.message ?? err.message)}`,
          source: "processing",
          meta: { dto, err: (err?.response?.data ?? err?.message) },
        });
      } catch { /* ignore auditing failure */ }

      throw err;
    }
  }

  async getLogs(): Promise<AuditRecord[]> {
    // returns audit records for processing via gateway->audit service
    return await auditAPI.getLogs("processing");
  }
}

export const processingAPI = new ProcessingAPI();
export default processingAPI;
