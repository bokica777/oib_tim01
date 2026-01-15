export type ReportType =
  | "SALES_SUMMARY"
  | "SALES_TREND"
  | "TOP_PERFUMES"
  | "TOP10_REVENUE_SUMMARY";

export interface AnalysisReport<TParams, TResult> {
  id: number;
  tipIzvestaja: ReportType;
  parametri: TParams;
  rezultat: TResult;
  datumKreiranja: string;
}
