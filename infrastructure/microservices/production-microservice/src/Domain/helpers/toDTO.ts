  import { Plant } from "../models/Plant";
  import { PlantDTO } from "../DTOs/PlantDTO";
  
  export function toDTO(p: Plant): PlantDTO {
    return {
      id: p.id,
      commonName: p.commonName,
      latinName: p.latinName,
      aromaticOilStrength: p.aromaticOilStrength,
      countryOfOrigin: p.countryOfOrigin,
      status: p.status,
    };
  }
