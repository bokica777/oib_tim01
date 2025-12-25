export class PerfumeDTO {
  id?: number;
  name!: string;
  type!: string;
  netVolumeMl!: number;
  serialNumber?: string;
  sourcePlantIds?: number[];
  expirationDate?: string;
  status?: string;
}
