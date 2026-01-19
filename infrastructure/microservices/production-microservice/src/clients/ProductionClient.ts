import axios from "axios";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";

export class ProductionClient {
  private baseUrl?: string;
  constructor() {
    this.baseUrl = process.env.PRODUCTION_URL;
  }


  async getPlants(count: number): Promise<PlantDTO[]> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not set");
    const resp = await axios.get(`${this.baseUrl}/plants?count=${count}`, { headers: {"x-gateway-key": process.env.GATEWAY_SECRET}});
    return resp.data as PlantDTO[];
  }

  async sendUsedPlants(ids: number[]): Promise<void> {
    if (!this.baseUrl) throw new Error("PRODUCTION_URL not set");
    await axios.post(`${this.baseUrl}/plants/used`, { ids }, { headers: {"x-gateway-key": process.env.GATEWAY_SECRET} });
  }
}
