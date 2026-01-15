import React from "react";

type Row = { label: string; value: number };

export const BarMini: React.FC<{
  title: string;
  rows: Row[];
  formatValue?: (v: number) => string;
}> = ({ title, rows, formatValue }) => {
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>

      {!rows || rows.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(() => {
            const max = Math.max(...rows.map((r) => r.value)) || 1;
            return rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr 120px",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.75 }}>{r.label}</div>
                <div
                  style={{
                    height: 10,
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(r.value / max) * 100}%`,
                      background: "currentColor",
                      opacity: 0.25,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, textAlign: "right" }}>{fmt(r.value)}</div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};
