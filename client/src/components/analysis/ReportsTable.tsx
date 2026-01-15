import React from "react";

export const ReportsTable: React.FC<{
  reports: any[];
  onPdf: (id: number) => void;
}> = ({ reports, onPdf }) => {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Prethodni izveštaji (export PDF)</div>

      {reports.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>Nema izveštaja.</div>
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
            {reports.map((r: any) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.tipIzvestaja ?? "-"}</td>
                <td>{r.datumKreiranja ? new Date(r.datumKreiranja).toLocaleString("sr-RS") : "-"}</td>
                <td align="right">
                  <button onClick={() => onPdf(r.id)}>Export PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
