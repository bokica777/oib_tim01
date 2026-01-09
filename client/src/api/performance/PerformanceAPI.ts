import axios, { AxiosInstance } from "axios";
import { IPerformanceAPI, RunSimulationDTO } from "./IPerformanceAPI";

export class PerformanceAPI implements IPerformanceAPI {
  private client: AxiosInstance;

  constructor() {
    const gateway = import.meta.env.VITE_GATEWAY_URL;

    this.client = axios.create({
      baseURL: `${gateway}/performance`,
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("token"); // <-- ako ti je "authToken", promeni ovde
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async runSimulation(dto: RunSimulationDTO): Promise<any> {
    const res = await this.client.post("/simulate", dto);
    return res.data;
  }

  async getReports(): Promise<any[]> {
    const res = await this.client.get("/reports");
    return res.data;
  }

  async getReportById(id: number): Promise<any> {
    const res = await this.client.get(`/reports/${id}`);
    return res.data;
  }

  async downloadPdf(id: number): Promise<Blob> {
    const res = await this.client.get(`/reports/${id}/pdf`, {
      responseType: "blob",
    });
    return res.data;
  }
}

export const performanceAPI = new PerformanceAPI();
