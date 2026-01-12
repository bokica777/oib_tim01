export class PerfumeDTO {
  id!: number;
  name!: string;
  type!: string;
  netVolumeMl!: number;
  serialNumber?: string;
  price!: number;   // cijena po komadu
  stock!: number;   // trenutno dostupno
  expirationDate?: string;
}
