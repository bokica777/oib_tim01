import { calculatePrice } from "./CalculatePrice";
import { Perfume } from "../Domain/models/Perfume";

  export function toDTO(p: Perfume) {
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      netVolumeMl: p.netVolumeMl,
      serialNumber: p.serialNumber,
      sourcePlantIds: p.sourcePlantIds,
      expirationDate: p.expirationDate?.toISOString(),
      status: p.status,
      price: calculatePrice(p.netVolumeMl),
    };
  }
