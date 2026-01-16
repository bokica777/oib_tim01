import { useEffect, useMemo, useState } from "react";
import {
  getSalesSummary,
  getSalesTrend,
  getTop10Revenue,
  getReports,
  downloadReportPdf,
  type GroupBy,
} from "../api/analysis/analysisSalesApi";

import { useAuth } from "../hooks/useAuthHook";

import { KpiCard } from "../components/analysis/KpiCard";
import { PeriodPicker, type PeriodUI } from "../components/analysis/PeriodPicker";
import { MiniLineChart } from "../components/analysis/MiniLineChart";
import { BarMini } from "../components/analysis/BarMini";
import { Top10RevenueTable } from "../components/analysis/Top10RevenueTable";
import { ReportsTable } from "../components/analysis/ReportsTable";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getDateRange(period: PeriodUI) {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);

  if (period === "month") {
    from.setDate(1);
  } else if (period === "week") {
    const day = now.getDay();
    const diff = (day + 6) % 7;
    from.setDate(now.getDate() - diff);
  } else {
    from.setMonth(0, 1);
  }

  return { from: toISODate(from), to: toISODate(to) };
}

function toNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x);
  return 0;
}

export default function AnalysisSalesPage() {
  const { token } = useAuth();
  const accessToken = token ?? undefined;

  const money = useMemo(
    () => new Intl.NumberFormat("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );
  const intFmt = useMemo(() => new Intl.NumberFormat("sr-RS"), []);

  const [period, setPeriod] = useState<PeriodUI>("month");
  const [{ from, to }, setRange] = useState(() => getDateRange("month"));

  const [summaryReport, setSummaryReport] = useState<any>(null);
  const [trendReport, setTrendReport] = useState<any>(null);
  const [top10RevenueReport, setTop10RevenueReport] = useState<any>(null);
  const [reportsList, setReportsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setRange(getDateRange(period));
  }, [period]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [summary, trend, top10rev, reports] = await Promise.all([
        getSalesSummary({ groupBy: period as GroupBy, from, to }, accessToken),
        getSalesTrend(from, to, "day", accessToken),
        getTop10Revenue(from, to, accessToken),
        getReports(accessToken),
      ]);

      setSummaryReport(summary);
      setTrendReport(trend);
      setTop10RevenueReport(top10rev);

      setReportsList(Array.isArray(reports) ? reports : reports?.rezultat ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Greška");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, from, to]);

  // KPI: sales-summary
  const summaryRow = summaryReport?.rezultat?.[0];
  const totalRevenue = summaryRow ? toNumber(summaryRow.prihod) : 0;
  const totalReceipts = summaryRow ? toNumber(summaryRow.brojRacuna) : 0;

  // TOP10
  const top10Obj = top10RevenueReport?.rezultat;
  const top10List = Array.isArray(top10Obj?.top10) ? top10Obj.top10 : [];
  const totalRevenueTop10 = toNumber(top10Obj?.totalRevenueTop10);

  const totalParfumsSold = top10List.reduce((acc: number, x: any) => acc + toNumber(x.kolicina), 0);

  type TrendPoint = {
  ts: number;
  label: string;
  qty: number;
  revenue: number;
  };
  // Trend chart data (sort by ts)
  const trendRows = Array.isArray(trendReport?.rezultat) ? trendReport.rezultat : [];
  const trendChart: TrendPoint[] = trendRows
  .map((p: any): TrendPoint => {
    const date = new Date(p.t);
    return {
      ts: date.getTime(),
      label: date.toLocaleDateString("sr-RS"),
      qty: toNumber(p.kolicina),
      revenue: toNumber(p.prihod),
    };
  })
  .sort((a: any, b: any) => a.ts - b.ts);

  async function onDownloadPdf(id: number) {
    try {
      const blob = await downloadReportPdf(id, accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `izvestaj-analiza-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message ?? "Greška pri preuzimanju PDF-a");
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <PeriodPicker
        title="Analiza prodaje"
        period={period}
        from={from}
        to={to}
        loading={loading}
        onChange={setPeriod}
        onRefresh={load}
      />

      {err ? (
        <div
          style={{
            border: "1px solid rgba(255,0,0,0.25)",
            background: "rgba(255,0,0,0.08)",
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <b>Greška:</b> {err}
        </div>
      ) : null}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginBottom: 12 }}>
        <KpiCard title="Ukupan prihod" value={money.format(totalRevenue)} suffix="RSD" hint="Ukupno u periodu" />
        <KpiCard title="Prodatih parfema (Top10 suma)" value={intFmt.format(totalParfumsSold)} hint="Suma količina" />
        <KpiCard title="Broj računa" value={intFmt.format(totalReceipts)} hint="Ukupno fiskalnih računa" />
        <KpiCard title="Prihod top 10" value={money.format(totalRevenueTop10)} suffix="RSD" hint="Top 10 parfema" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <MiniLineChart
          title="Broj prodatih parfema po danima"
          points={trendChart.map(x => x.qty)}
          labels={trendChart.map(x => x.label)}
          formatY={(v) => intFmt.format(v)}
        />    
        <BarMini
          title="Prihod po danima"
          rows={trendChart.map(x => ({ label: x.label, value: x.revenue }))}
          formatValue={(v) => money.format(v)}
        />
      </div>

      {/* Top10 + Reports */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <Top10RevenueTable title="Najprodavaniji parfemi (Top 10)" rows={top10List} totalRevenueTop10={totalRevenueTop10} />
        <ReportsTable reports={reportsList} onPdf={onDownloadPdf} />
      </div>
    </div>
  );
}
