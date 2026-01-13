
export type PackagingDTO = {
  id: string;                      
  code: string;                    
  perfumeId: string;               
  perfumeName?: string;            
  volumeMl?: 150 | 250;            
  warehouseId: string;             
  status: "PACKED" | "SENT" | "STORED";
  createdAt?: string;
  count?: number; 
};
