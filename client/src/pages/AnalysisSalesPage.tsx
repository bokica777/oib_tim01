import React, { useEffect, useMemo, useState } from "react";
import { getSalesSummary, getSalesTrend, getTop10Revenue, type GroupBy, downloadReportPdf, getReports } from "../api/analysis/analysisSalesApi";
import type { AnalysisReport } from "../models/analysis/analysisReport";

function useAuthToken(): string | undefined {
  return undefined;
}

type PeriodUI = "month" | "week" | "year";

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
    const day = now.getDay(); // 0..6
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
  const token = useAuthToken();

  const money = useMemo(
    () => new Intl.NumberFormat("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    []
  );
  const intFmt = useMemo(() => new Intl.NumberFormat("sr-RS"), []);

  const [period, setPeriod] = useState<PeriodUI>("month");
  const [{ from, to }, setRange] = useState(() => getDateRange("month"));

  const [summaryReport, setSummaryReport] = useState<AnalysisReport<any, any> | null>(null);
  const [trendReport, setTrendReport] = useState<AnalysisReport<any, any> | null>(null);
  const [top10RevenueReport, setTop10RevenueReport] = useState<AnalysisReport<any, any> | null>(null);

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
        getSalesSummary({ groupBy: period as GroupBy, from, to }, token),
        getSalesTrend(from, to, "day", token),
        getTop10Revenue(from, to, token),
        getReports(token),
      ]);

      setSummaryReport(summary);
      setTrendReport(trend);
      setTop10RevenueReport(top10rev);

      setReportsList(Array.isArray(reports) ? reports : (reports?.rezultat ?? reports?.items ?? []));
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

  // TOP10: top10-revenue
  const top10Obj = top10RevenueReport?.rezultat;
  const top10List = Array.isArray(top10Obj?.top10) ? top10Obj.top10 : [];
  const totalRevenueTop10 = toNumber(top10Obj?.totalRevenueTop10);

  // “Prodatih parfema” (pošto top10-revenue vraća količine)
  const totalParfumsSold = top10List.reduce((acc: number, x: any) => acc + toNumber(x.kolicina), 0);

  // Trend chart data
  const trendRows = Array.isArray(trendReport?.rezultat) ? trendReport!.rezultat : [];
  const trendChart = trendRows
    .map((p: any) => ({
      label: new Date(p.t).toLocaleDateString("sr-RS"),
      value: toNumber(p.prihod),
      receipts: toNumber(p.brojRacuna),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  async function onDownloadPdf(id: number) {
    try {
      const blob = await downloadReportPdf(id, token);
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
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Analiza prodaje</h2>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodUI)}>
            <option value="month">Mesečno</option>
            <option value="week">Nedeljno</option>
            <option value="year">Godišnje</option>
          </select>

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {from} → {to}
          </div>

          <button onClick={load} disabled={loading}>Osveži</button>
        </div>
      </div>

      {err && <div style={{ color: "crimson" }}>{err}</div>}
      {loading && <div>Učitavanje...</div>}

      {/* KPI kartice */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Kpi title="Ukupan prihod" value={`${money.format(totalRevenue)} RSD`} />
        <Kpi title="Prodatih parfema (Top10 suma)" value={`${intFmt.format(totalParfumsSold)}`} />
        <Kpi title="Broj računa" value={`${intFmt.format(totalReceipts)}`} />
        <Kpi title="Prihod top 10" value={`${money.format(totalRevenueTop10)} RSD`} />
      </div>

      {/* Grafovi */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Panel title="Trend prodaje (prihod po danu)">
          {trendChart.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka za trend.</div>
          ) : (
            <LineChart
              points={trendChart.map(x => x.value)}
              labels={trendChart.map(x => x.label)}
              formatY={(v) => money.format(v)}
            />
          )}
        </Panel>

        <Panel title="Zarada po periodu (iz summary)">
          <BarMini
            rows={(summaryReport?.rezultat ?? []).map((r: any) => ({
              label: r.period,
              value: toNumber(r.prihod),
            }))}
            formatValue={(v) => money.format(v)}
          />
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Panel title="Analiza trenda prodaje">
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            <li>Ukupan prihod u periodu: {money.format(totalRevenue)} RSD</li>
            <li>Broj fiskalnih računa: {intFmt.format(totalReceipts)}</li>
            <li>Ukupan prihod top 10: {money.format(totalRevenueTop10)} RSD</li>
            {trendChart.length > 0 && (
              <>
                <li>Najviši dnevni prihod: {money.format(Math.max(...trendChart.map(x => x.value)))} RSD</li>
                <li>Najniži dnevni prihod: {money.format(Math.min(...trendChart.map(x => x.value)))} RSD</li>
              </>
            )}
          </ul>
        </Panel>

        <Panel title="Najprodavaniji parfemi (Top 10)">
          {top10List.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka za Top 10.</div>
          ) : (
            <>
              <table style={{ width: "100%", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th align="left">#</th>
                    <th align="left">Naziv</th>
                    <th align="right">Količina</th>
                    <th align="right">Prihod</th>
                  </tr>
                </thead>
                <tbody>
                  {top10List.map((x: any, idx: number) => (
                    <tr key={`${x.parfemId ?? x.parfemID ?? idx}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{x.nazivParfema}</td>
                      <td align="right">{intFmt.format(toNumber(x.kolicina))}</td>
                      <td align="right">{money.format(toNumber(x.prihod))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 8, fontWeight: 700 }}>
                Ukupan prihod top 10: {money.format(totalRevenueTop10)} RSD
              </div>
            </>
          )}
        </Panel>
      </div>

      <Panel title="Prethodni izveštaji (export PDF)">
        {reportsList.length === 0 ? (
          <div>Nema izveštaja.</div>
        ) : (
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th align="left">ID</th>
                <th align="left">Tip</th>
                <th align="left">Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reportsList.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.tipIzvestaja ?? "-"}</td>
                  <td>{r.datumKreiranja ? new Date(r.datumKreiranja).toLocaleString("sr-RS") : "-"}</td>
                  <td align="right">
                    <button onClick={() => onDownloadPdf(r.id)}>Export PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

/** Minimalni SVG line chart bez biblioteka */
function LineChart({
  points,
  labels,
  formatY,
}: {
  points: number[];
  labels: string[];
  formatY: (v: number) => string;
}) {
  const w = 520;
  const h = 180;
  const pad = 24;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((v) => h - pad - ((v - min) * (h - pad * 2)) / span);

  const d = points.map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
        {points.map((v, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="currentColor">
            <title>{`${labels[i]}: ${formatY(v)}`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Min: {formatY(min)} • Max: {formatY(max)}
      </div>
    </div>
  );
}

/** Minimalni “bar list” bez biblioteka */
function BarMini({
  rows,
  formatValue,
}: {
  rows: { label: string; value: number }[];
  formatValue: (v: number) => string;
}) {
  if (!rows || rows.length === 0) {
    return <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka.</div>;
  }
  const max = Math.max(...rows.map(r => r.value)) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 120px", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{r.label}</div>
          <div style={{ height: 10, border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(r.value / max) * 100}%`, background: "currentColor", opacity: 0.25 }} />
          </div>
          <div style={{ fontSize: 12, textAlign: "right" }}>{formatValue(r.value)}</div>
        </div>
      ))}
    </div>
  );
}
