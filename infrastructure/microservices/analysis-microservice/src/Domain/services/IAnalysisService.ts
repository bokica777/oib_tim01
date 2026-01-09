import { AnalysisReport } from "../models/AnalysisReport";

export type TopPerfumesType = "quantity" | "revenue";
export type GroupByPeriod = "week" | "month" | "year" | "total";

export interface DateRangeQuery {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface TopPerfumesQuery extends DateRangeQuery {
  limit?: number;          // default 10
  type?: TopPerfumesType;  // "quantity" | "revenue"
}

/**
 * Ukupna prodaja i zarada po periodu.
 * - total: vraća jedan red (ukupno)
 * - week/month/year: vraća više redova (period + prihodi + kolicine + broj racuna)
 */
export interface SalesSummaryQuery extends DateRangeQuery {
  groupBy: GroupByPeriod;
}

/**
 * Trend prodaje: vremenska serija po danu/nedelji/mesecu.
 * (Možeš kasnije dodati i "granularity", za sad koristimo day)
 */
export interface SalesTrendQuery extends DateRangeQuery {
  granularity?: "day" | "week" | "month"; // default day
}

export interface ListReportsQuery {
  limit?: number;     // default 50
  offset?: number;    // default 0
  tipIzvestaja?: string; // optional filter
}

export interface IAnalysisService {
  getTopPerfumes(query: TopPerfumesQuery): Promise<AnalysisReport>;

  getSalesSummary(query: SalesSummaryQuery): Promise<AnalysisReport>;

  getSalesTrend(query: SalesTrendQuery): Promise<AnalysisReport>;

  getTop10RevenueSummary(query: DateRangeQuery): Promise<AnalysisReport>;

  listReports(query: ListReportsQuery): Promise<AnalysisReport[]>;
  getReportById(id: number): Promise<AnalysisReport | null>;
}

