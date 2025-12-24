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
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not configured");
    const url = `${this.baseUrl}/plants?count=${count}`;
    const resp = await axios.get(url, { headers: this.headers(), timeout: 10000 });
    return resp.data as PlantDTO[];
  }

  async sendUsedPlants(ids: number[]): Promise<void> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not configured");
    const url = `${this.baseUrl}/plants/used`;
    await axios.post(url, { ids }, { headers: this.headers(), timeout: 10000 });
  }

  async plantAndScale(sourceStrength: number, factorPercent: number = 65): Promise<any> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not configured");
    const url = `${this.baseUrl}/balance`;
    const resp = await axios.post(url, { sourceStrength, factor: factorPercent }, { headers: this.headers(), timeout: 10000 });
    return resp.data;
  }
}
