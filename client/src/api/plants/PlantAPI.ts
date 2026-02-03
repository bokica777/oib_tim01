import axios, { AxiosInstance } from "axios";
import { Plant } from "../../types/Plant";
import { IPlantAPI } from "./IPlantAPI";

export class PlantAPI implements IPlantAPI {
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private getAuthHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async getPlants(token: string, count = 50): Promise<Plant[]> {
    const res = await this.axiosInstance.get(
      `/production/plants?count=${count}`,
      { headers: this.getAuthHeaders(token) }
    );
    return res.data;
  }

  async plantNew(
    plant: Partial<Plant>,
    token: string
  ): Promise<Plant> {
    const res = await this.axiosInstance.post(
      `/production/plant`,
      plant,
      { headers: this.getAuthHeaders(token) }
    );
    return res.data;
  }
  async plantAndScale(
    sourceStrength: number,
    factor: number,
    token: string
  ): Promise<Plant> {
    const res = await this.axiosInstance.post(
      `/production/balance`,
      { sourceStrength, factor },
      { headers: this.getAuthHeaders(token) }
    );
    return res.data;
  }

  async harvest(
    commonName: string,
    count: number,
    token: string
  ): Promise<Plant[]> {
    const res = await this.axiosInstance.post(
      `/production/harvest`,
      { commonName, count },
      { headers: this.getAuthHeaders(token) }
  );
  return res.data;
 }

async adjustStrength(
  plantId: number,
  value: number,
  token: string,
  commonName?: string,
  mode: "inc" | "scale" = "inc"
): Promise<Plant> {
  const res = await this.axiosInstance.put(
    `/production/adjust/${plantId}`,
    { value, commonName, mode },
    { headers: this.getAuthHeaders(token) }
  );
  return res.data;
}



}
