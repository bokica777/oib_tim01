import { PlantStatus } from "../enums/PlantStatus";

export interface PlantDTO {
  id?: number;
  commonName: string;
  latinName: string;
  aromaticOilStrength: number;
  countryOfOrigin: string;
  status: PlantStatus;
}
