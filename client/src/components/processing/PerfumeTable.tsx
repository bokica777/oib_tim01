import React, { useState } from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";

type Props = {
  perfumes: PerfumeDTO[];
  onDetails: (perfume: PerfumeDTO) => void;
};

const PerfumeTable: React.FC<Props> = ({ perfumes, onDetails }) => {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 6px",
    fontSize: 14,
    lineHeight: 1.5,
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 14px",
    fontWeight: 600,
    fontSize: 13,
    color: "#e5e7eb",
    opacity: 0.9,
  };

  const emptyRowStyle: React.CSSProperties = {
    padding: 18,
    opacity: 0.6,
    textAlign: "center",
    fontStyle: "italic",
    color: "#94a3b8",
  };

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>Naziv</th>
          <th style={thStyle}>Zapremina</th>
          <th style={thStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {perfumes.length === 0 && (
          <tr>
            <td colSpan={3} style={emptyRowStyle}>
              Nema dostupnih parfema.
            </td>
          </tr>
        )}

        {perfumes.map((p) => {
          const isHovered = hoveredId === p.id;

          const rowStyle: React.CSSProperties = {
            cursor: "pointer",
            background: isHovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
            color: "#f8fafc",
            transition: "background 0.2s",
            borderRadius: 8,
          };

          const cellStyle: React.CSSProperties = {
            padding: "12px 14px",
            verticalAlign: "middle",
          };

          return (
            <tr
              key={p.id}
              style={rowStyle}
              onClick={() => onDetails(p)}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <td style={cellStyle}>{p.name}</td>
              <td style={cellStyle}>{p.volume} ml</td>
              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: p.status === "SENT" ? "#dbeafe" : "#bbf7d0",
                    color: p.status === "SENT" ? "#1e293b" : "#064e3b",
                  }}
                >
                  {p.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PerfumeTable;
