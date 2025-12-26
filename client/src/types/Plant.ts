import { PlantStatus } from "./PlantStatus";

export interface Plant {
  id: number;
  commonName: string;
  latinName: string;
  aromaticOilStrength: number;
  countryOfOrigin: string;
  status: PlantStatus;
}
