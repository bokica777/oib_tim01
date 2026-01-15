import React from "react";

type Props = {
  title: string;
  points: number[];
  labels: string[];
  formatY?: (v: number) => string;
  footer?: React.ReactNode;
};

export const MiniLineChart: React.FC<Props> = ({ title, points, labels, formatY, footer }) => {
  if (!points || points.length === 0) {
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
        <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka.</div>
      </div>
    );
  }

  const w = 520;
  const h = 180;
  const pad = 24;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((v) => h - pad - ((v - min) * (h - pad * 2)) / span);

  const d = points
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");

  const fmt = formatY ?? ((v: number) => String(v));

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

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
        {points.map((v, i) => (
          <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="currentColor">
            <title>{`${labels[i]}: ${fmt(v)}`}</title>
          </circle>
        ))}
      </svg>

      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Min: {fmt(min)} • Max: {fmt(max)}
      </div>

      {footer ? <div style={{ marginTop: 8 }}>{footer}</div> : null}
    </div>
  );
};
