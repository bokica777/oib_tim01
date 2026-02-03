import { AnalysisReport } from "../Domain/models/AnalysisReport";
import { PdfDocument, PdfBlock } from "../Domain/DTOs/PdfReportDTO";

function iso(d: any) {
  try { return new Date(d).toISOString(); } catch { return String(d ?? ""); }
}

export class PdfReportFormatter {
  public static toPdfDocument(report: AnalysisReport): PdfDocument {
    const type = report.tipIzvestaja;
    const params = report.parametri ?? {};
    const result = report.rezultat ?? null;

    const blocks: PdfBlock[] = [];

    blocks.push({ type: "title", text: "Izveštaj analize" });
    blocks.push({ type: "subtitle", text: `Tip: ${type}` });
    blocks.push({ type: "paragraph", text: `Kreirano: ${iso((report as any).datumKreiranja)}` });
    blocks.push({ type: "spacer" });

    if (type === "TOP_PERFUMES") {
      blocks.push({ type: "subtitle", text: "Top parfemi" });

      blocks.push({
        type: "metric",
        metrics: [
          { label: "Limit", value: params.limit ?? 10 },
          { label: "Sort", value: params.type ?? "revenue" },
          { label: "Period od", value: params.from ?? "-" },
          { label: "Period do", value: params.to ?? "-" },
        ],
      });

      blocks.push({
        type: "table",
        title: "Rang lista",
        columns: [
          { key: "parfemId", label: "ID" },
          { key: "nazivParfema", label: "Parfem" },
          { key: "kolicina", label: "Količina" },
          { key: "prihod", label: "Prihod" },
        ],
        rows: Array.isArray(result) ? result : [],
      });
    }

    else if (type === "SALES_SUMMARY") {
      blocks.push({ type: "subtitle", text: "Ukupna prodaja i prihod" });

      blocks.push({
        type: "metric",
        metrics: [
          { label: "Grupisanje", value: params.groupBy ?? "total" },
          { label: "Period od", value: params.from ?? "-" },
          { label: "Period do", value: params.to ?? "-" },
        ],
      });

      blocks.push({
        type: "table",
        title: "Rezultat",
        columns: [
          { key: "period", label: "Period" },
          { key: "prihod", label: "Prihod" },
          { key: "brojRacuna", label: "Broj računa" },
        ],
        rows: Array.isArray(result) ? result : [result].filter(Boolean),
        footerNote: "Napomena: period je po groupBy kriterijumu.",
      });
    }

    else if (type === "SALES_TREND") {
      blocks.push({ type: "subtitle", text: "Trend prodaje" });

      blocks.push({
        type: "metric",
        metrics: [
          { label: "Granularnost", value: params.granularity ?? "day" },
          { label: "Period od", value: params.from ?? "-" },
          { label: "Period do", value: params.to ?? "-" },
        ],
      });

      blocks.push({
        type: "table",
        title: "Vremenska serija",
        columns: [
          { key: "t", label: "Vreme" },
          { key: "prihod", label: "Prihod" },
          { key: "brojRacuna", label: "Broj računa" },
        ],
        rows: Array.isArray(result) ? result : [],
      });

      blocks.push({
        type: "paragraph",
        text: "Klijent može iz ovih podataka nacrtati grafikon (linijski chart) i ubaciti ga u PDF.",
      });
    }

    else if (type === "TOP10_REVENUE_SUMMARY") {
      blocks.push({ type: "subtitle", text: "Top 10 parfema + ukupan prihod top 10" });

      blocks.push({
        type: "metric",
        metrics: [
          { label: "Period od", value: params.from ?? "-" },
          { label: "Period do", value: params.to ?? "-" },
        ],
      });

      const top10 = result?.top10 ?? [];
      const totalRevenueTop10 = result?.totalRevenueTop10 ?? 0;

      blocks.push({
        type: "metric",
        metrics: [{ label: "Ukupan prihod top 10", value: totalRevenueTop10 }],
      });

      blocks.push({
        type: "table",
        title: "Top 10 lista",
        columns: [
          { key: "parfemId", label: "ID" },
          { key: "nazivParfema", label: "Parfem" },
          { key: "kolicina", label: "Količina" },
          { key: "prihod", label: "Prihod" },
        ],
        rows: Array.isArray(top10) ? top10 : [],
      });
    }

    else {
      blocks.push({ type: "subtitle", text: "Generički izveštaj" });
      blocks.push({ type: "paragraph", text: "Format nije specijalizovan; prikaz sirovih podataka ispod." });
      blocks.push({
        type: "table",
        title: "Raw rezultat",
        columns: [{ key: "value", label: "Value" }],
        rows: [{ value: JSON.stringify(result) }],
      });
    }

    return {
      meta: {
        reportId: report.id,
        reportType: type,
        createdAt: iso((report as any).datumKreiranja),
        period: { from: params.from ?? null, to: params.to ?? null },
        params,
      },
      blocks,
    };
  }
}
