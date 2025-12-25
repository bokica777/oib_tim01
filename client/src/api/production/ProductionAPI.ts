import axios, { AxiosInstance } from "axios";
import { IProductionAPI } from "./IProductionAPI";

export class ProductionAPI implements IProductionAPI {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL + "/production",
      headers: { "Content-Type": "application/json" },
      timeout: 8000,
    });

    // ⬇️ SVAKI REQUEST DODAJE TOKEN
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken"); // <-- ako ti je key drugačiji, promijeni ovdje
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAvailablePlants(count: number = 100) {
    const res = await this.client.get(`/plants?count=${count}`);
    return res.data;
  }

  async plantNew(data: any) {
    const res = await this.client.post("/plant", data);
    return res.data;
  }

  async adjustStrength(id: number, payload: { value: number; mode?: "inc" | "scale" }) {
    const res = await this.client.put(`/adjust/${id}`, payload);
    return res.data;
  }

  async harvest(payload: { commonName: string; count: number }) {
    const res = await this.client.put("/harvest", payload);
    return res.data;
  }

  async markUsed(ids: number[]) {
    await this.client.post("/plants/used", { ids });
  }

  async plantAndScale(payload: { sourceStrength: number; factor?: number }) {
    const res = await this.client.post("/balance", payload);
    return res.data;
  }
}
