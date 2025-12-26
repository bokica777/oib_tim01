// src/api/processing/ProcessingAPIClient.ts
import axios, { AxiosInstance } from "axios";
import { IProcessingAPI } from "./IProcessingAPI";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO"; 
import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";

export class ProcessingAPI implements IProcessingAPI {
    private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: (import.meta.env.VITE_GATEWAY_URL ?? "") + "/processing",
      headers: { "Content-Type": "application/json" },
      timeout: 12000,
    });

    // Add Authorization automatically if token present
    this.client.interceptors.request.use((cfg) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as any).Authorization = `Bearer ${token}`;
      }
      return cfg;
    });
  }

  async listAvailable(): Promise<PerfumeDTO[]> {
    const res = await this.client.get<PerfumeDTO[]>("/perfumes");
    return res.data;
  }

  async getById(id: number): Promise<PerfumeDTO> {
    const res = await this.client.get<PerfumeDTO>(`/perfumes/${id}`);
    return res.data;
  }

  async process(dto: ProcessRequestDTO): Promise<PerfumeDTO[]> {
    const res = await this.client.post<PerfumeDTO[]>("/process", dto);
    return res.data;
  }

  // Packaging / sales calls this to reserve perfumes
  async requestForPackaging(name: string, count: number): Promise<PerfumeDTO[]> {
    const res = await this.client.post<PerfumeDTO[]>("/perfumes/request", { name, count });
    return res.data;
  }
}

export const processingAPI = new ProcessingAPI();