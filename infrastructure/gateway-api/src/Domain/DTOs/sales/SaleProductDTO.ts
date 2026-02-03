export type SaleVariantDTO = {
  perfumeId: number;
  volumeMl: number;
  price: number;
  stock: number;
};

export type SaleProductDTO = {
  name: string;         
  variants: SaleVariantDTO[];
  stockTotal: number;
};
