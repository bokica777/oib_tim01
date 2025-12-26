import { PlantStatus } from "./PlantStatus";

export interface PlantFiltersTypes {
  status?: PlantStatus;
  minOilStrength?: number;
  maxOilStrength?: number;
  countryOfOrigin?: string;
}
