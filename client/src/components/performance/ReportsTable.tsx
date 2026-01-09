import React from "react";
import type { PerformanceReportDTO } from "../../models/performance/PerformanceReportDTO";

type Props = {
  reports: PerformanceReportDTO[];
  selectedId?: number | null;
  onSelect: (r: PerformanceReportDTO) => void;
  onPdf: (id: number) => void;
};

export const ReportsTable: React.FC<Props> = ({ reports, selectedId, onSelect, onPdf }) => {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Istorija izveštaja</div>

      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.75 }}>
            <th>ID</th>
            <th>Algoritam</th>
            <th>Vreme</th>
            <th>Uspešnost</th>
            <th>Resursi</th>
            <th>Datum</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => {
            const active = selectedId === r.id;
            return (
              <tr
                key={r.id}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.10)",
                  background: active ? "rgba(0,200,255,0.08)" : "transparent",
                }}
              >
                <td>{r.id}</td>
                <td>{r.algorithmName}</td>
                <td>{r.executionTime.toFixed(2)} s</td>
                <td>{r.successRate.toFixed(0)}%</td>
                <td>{r.resourceUsage.toFixed(0)}%</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  <button onClick={() => onSelect(r)} style={{ marginRight: 8 }}>
                    Prikaži
                  </button>
                  <button onClick={() => onPdf(r.id)}>PDF</button>
                </td>
              </tr>
            );
          })}

          {reports.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 14, opacity: 0.7 }}>
                Nema izveštaja. Pokreni simulaciju da se kreira novi.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};
