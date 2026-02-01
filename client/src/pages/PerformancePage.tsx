import { useEffect, useMemo, useState } from "react";
import { performanceAPI } from "../api/performance/PerformanceAPI";
import type { PerformanceReportDTO } from "../models/performance/PerformanceReportDTO";
import { mapPerformanceReport } from "../models/performance/mapPerformanceReport";

import { KpiCard } from "../components/performance/KpiCard";
import { MiniLineChart } from "../components/performance/MiniLineChart";
import { ReportsTable } from "../components/performance/ReportsTable";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PerformancePage() {
  const [reports, setReports] = useState<PerformanceReportDTO[]>([]);
  const [selected, setSelected] = useState<PerformanceReportDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const list = await performanceAPI.getReports();
      const mapped = list.map(mapPerformanceReport);
      setReports(mapped);
      setSelected(mapped[0] ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Ne mogu da učitam izveštaje.");
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation(algorithmName: string) {
    setRunning(true);
    setError(null);
    try {
      await performanceAPI.runSimulation({ algorithmName });
      await loadReports();
    } catch (e: any) {
      setError(e?.message ?? "Simulacija nije uspela.");
    } finally {
      setRunning(false);
    }
  }

  async function refreshSelected(id: number) {
    setError(null);
    try {
      const raw = await performanceAPI.getReportById(id);
      const one = mapPerformanceReport(raw);
      setSelected(one);
    } catch (e: any) {
      setError(e?.message ?? "Ne mogu da učitam izveštaj.");
    }
  }

  async function onPdf(id: number) {
    setError(null);
    try {
      const blob = await performanceAPI.downloadPdf(id);
      downloadBlob(blob, `performance-report-${id}.pdf`);
    } catch (e: any) {
      setError(e?.message ?? "Ne mogu da preuzmem PDF.");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const algo = selected?.algorithmName ?? null;

  const lastN = useMemo(() => {
    const filtered = algo ? reports.filter(r => r.algorithmName === algo) : reports;
    return filtered.slice(0, 10).reverse();
  }, [reports, algo]);

  const timeSeries = useMemo(() => lastN.map((r) => r.executionTime), [lastN]);
  const successSeries = useMemo(() => lastN.map((r) => r.successRate), [lastN]);
  const resourceSeries = useMemo(() => lastN.map((r) => r.resourceUsage), [lastN]);

  const kpiExecution = selected?.executionTime ?? 0;
  const kpiSuccess = selected?.successRate ?? 0;
  const kpiResources = selected?.resourceUsage ?? 0;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Analiza performansi</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Simulacije logističkih algoritama i pregled izveštaja.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={running || loading}
            onClick={() => runSimulation("DISTRIBUTIVNI_CENTAR")}
            style={{ padding: "10px 12px", borderRadius: 10 }}
          >
            {running ? "Pokrećem..." : "Pokreni: Distributivni"}
          </button>
          <button
            disabled={running || loading}
            onClick={() => runSimulation("MAGACIN")}
            style={{ padding: "10px 12px", borderRadius: 10 }}
          >
            {running ? "Pokrećem..." : "Pokreni: Magacin"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid rgba(255,0,0,0.25)",
            background: "rgba(255,0,0,0.08)",
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <b>Greška:</b> {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <KpiCard
          title="Ukupno izveštaja"
          value={loading ? "..." : reports.length}
          hint="Izveštaji se čuvaju u bazi (DESC)"
        />
        <KpiCard title="Vreme izvršavanja" value={kpiExecution.toFixed(0)} suffix="ms" hint="Niže je bolje" />
        <KpiCard title="Stopa uspeha" value={kpiSuccess.toFixed(0)} suffix="%" hint="Više je bolje" />
        <KpiCard title="Resursi" value={kpiResources.toFixed(0)} suffix="%" hint="Opterećenje sistema" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <MiniLineChart title="Trend vremena izvršavanja" values={timeSeries} valueSuffix="s" />
        <MiniLineChart title="Trend uspešnosti" values={successSeries} valueSuffix="%" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <MiniLineChart title="Trend korišćenja resursa" values={resourceSeries} valueSuffix="%" />

        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Sažetak izveštaja</div>
          <div style={{ fontSize: 13, opacity: 0.85, whiteSpace: "pre-line", lineHeight: 1.5 }}>
            {selected?.summary ?? (loading ? "Učitavam..." : "Izaberi izveštaj iz tabele.")}
          </div>

          {selected ? (
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button type="button" disabled={loading} onClick={loadReports}>
                Osveži listu
              </button>

              <button type="button" disabled={loading} onClick={() => onPdf(selected.id)}>
                Preuzmi PDF
              </button>

            </div>
          ) : null}
        </div>
      </div>

      <ReportsTable
        reports={reports}
        selectedId={selected?.id ?? null}
        onSelect={(r) => {
          setSelected(r);
          refreshSelected(r.id);
        }}
        onPdf={onPdf}
      />
    </div>
  );
}
