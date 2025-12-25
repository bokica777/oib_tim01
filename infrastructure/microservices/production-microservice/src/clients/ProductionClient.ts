// src/clients/ProductionClient.ts
import axios from "axios";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";

export class ProductionClient {
  private baseUrl?: string;
  constructor() {
    this.baseUrl = process.env.PRODUCTION_URL;
  }

  private headers() {
    return { "x-gateway-key": process.env.GATEWAY_SECRET };
  }

  async getPlants(count: number): Promise<PlantDTO[]> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not set");
    const resp = await axios.get(`${this.baseUrl}/plants?count=${count}`, { headers: this.headers() });
    return resp.data as PlantDTO[];
  }

  async sendUsedPlants(ids: number[]): Promise<void> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not set");
    await axios.post(`${this.baseUrl}/plants/used`, { ids }, { headers: this.headers() });
  }
}
