export type PackagingDTO = {
  id: string;
  code: string;
  count: number;
  warehouseId: string;
  status?: "STORED" | "SENT" | "PACKED";
  createdAt?: string;
};
