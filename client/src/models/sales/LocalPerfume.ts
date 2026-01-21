import { Variant } from "./Variant";
export type LocalPerfume = {
  id: number | string; // representative id (first variant) - used for keying
  name: string;
  netVolumeMl?: number; // representative
  price?: number; // representative
  stock?: number;
  variants: Variant[]; // important — holds 150/250 etc.
};
