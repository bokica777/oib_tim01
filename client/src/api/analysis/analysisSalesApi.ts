import type { AnalysisReport } from "../../models/analysis/analysisReport";

const baseUrl = import.meta.env.VITE_GATEWAY_URL;

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type GroupBy = "month" | "week" | "year";
export type Granularity = "day" | "month";

export type SalesSummaryParams = { groupBy: GroupBy; from: string; to: string };
export type SalesSummaryRow = { prihod: string; brojRacuna: string; period: string };

export async function getSalesSummary(
  params: SalesSummaryParams,
  token?: string
): Promise<AnalysisReport<SalesSummaryParams, SalesSummaryRow[]>> {
  const { groupBy, from, to } = params;
  const res = await fetch(
    `${baseUrl}/analysis/sales-summary?groupBy=${groupBy}&from=${from}&to=${to}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Greška pri dobavljanju sažetka prodaje");
  return res.json();
}

export async function getSalesTrend(from: string, to: string, granularity: "day" | "month", token?: string) {
  const res = await fetch(
    `${baseUrl}/analysis/sales-trend?granularity=${granularity}&from=${from}&to=${to}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Greška pri dobavljanju trenda prodaje");
  return res.json();
}

export async function getTopPerfumes(limit = 10, type: "revenue" | "quantity" = "revenue", token?: string) {
  const res = await fetch(
    `${baseUrl}/analysis/top-perfumes?limit=${limit}&type=${type}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Greška pri dobavljanju top parfema");
  return res.json();
}

export async function getTop10Revenue(from: string, to: string, token?: string) {
  const res = await fetch(
    `${baseUrl}/analysis/top10-revenue?from=${from}&to=${to}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error("Greška pri dobavljanju top10 revenue");
  return res.json();
}

export async function getReports(token?: string) {
  const res = await fetch(`${baseUrl}/analysis/reports?limit=50&offset=0`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Greška pri dobavljanju izveštaja");
  return res.json();
}

export async function downloadReportPdf(id: number, token?: string): Promise<Blob> {
  const res = await fetch(`${baseUrl}/analysis/reports/${id}/pdf`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Greška pri preuzimanju PDF-a");
  return res.blob();
}

export async function createSalesReport(dto: any, token?: string) {
  const res = await fetch(`${baseUrl}/analysis/sales-report`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Greška pri kreiranju izveštaja");
  }

  return res.json();
}
