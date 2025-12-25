export interface IProductionAPI {
  getAvailablePlants(count?: number): Promise<any[]>;

  plantNew(data: {
    commonName?: string;
    latinName?: string;
    countryOfOrigin?: string;
  }): Promise<any>;

  adjustStrength(
    id: number,
    payload: { value: number; mode?: "inc" | "scale" }
  ): Promise<any>;

  harvest(payload: { commonName: string; count: number }): Promise<any[]>;

  markUsed(ids: number[]): Promise<void>;

  plantAndScale(payload: { sourceStrength: number; factor?: number }): Promise<any>;
}
