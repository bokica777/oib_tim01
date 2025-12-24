import { AnalysisReport } from "../models/AnalysisReport";

export type TopPerfumesType = "quantity" | "revenue";

export interface TopPerfumesQuery {
  limit?: number;          // default 10
  from?: string;           // "YYYY-MM-DD"
  to?: string;             // "YYYY-MM-DD"
  type?: TopPerfumesType;  // "quantity" | "revenue"
}

export interface IAnalysisService {
  getTopPerfumes(query: TopPerfumesQuery): Promise<AnalysisReport>;
}
