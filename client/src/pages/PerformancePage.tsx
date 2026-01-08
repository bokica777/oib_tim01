import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { PerformanceService } from "../../api/performance.service";

export default function PerformancePage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const loadReports = async () => {
    const res = await PerformanceService.getReports();
    setReports(res.data);
    if (res.data.length > 0) {
      setSelectedReport(res.data[0]);
    }
  };

  const runSimulation = async (algorithm: string) => {
    await PerformanceService.runSimulation(algorithm);
    await loadReports();
  };

  const downloadPdf = async (id: number) => {
    const res = await PerformanceService.downloadPdf(id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${id}.pdf`;
    a.click();
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Analiza performansi logističkih algoritama</h1>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button onClick={() => runSimulation("DISTRIBUTIVNI_CENTAR")}>
          Pokreni – Distributivni centar
        </button>
        <button onClick={() => runSimulation("MAGACIN")}>
          Pokreni – Magacin
        </button>
      </div>

      {/* KPI CARDS */}
      {selectedReport && (
        <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
          <Kpi title="Algoritam" value={selectedReport.algorithmName} />
          <Kpi title="Kapacitet po slanju" value={selectedReport.capacity} />
          <Kpi title="Vreme nabavke (s)" value={selectedReport.supplyTime} />
          <Kpi title="Ukupno iteracija" value={selectedReport.iterations} />
        </div>
      )}

      {/* CHART */}
      {selectedReport && (
        <div style={{ height: 300, marginBottom: 40 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={selectedReport.metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteration" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="throughput"
                stroke="#1976d2"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* REPORTS TABLE */}
      <table width="100%" border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Algoritam</th>
            <th>Datum</th>
            <th>Akcije</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.algorithmName}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => setSelectedReport(r)}>
                  Prikaži
                </button>
                <button onClick={() => downloadPdf(r.id)}>
                  PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* KPI COMPONENT */
function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <div
      style={{
        padding: 16,
        minWidth: 180,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h4>{title}</h4>
      <strong style={{ fontSize: 18 }}>{value}</strong>
    </div>
  );
}
