import React, { useMemo } from "react";

type Props = {
  title: string;
  labels: string[];
  values: number[];
  valueSuffix?: string;
};

export const SalesBarChart: React.FC<Props> = ({ title, labels, values, valueSuffix }) => {
  const W = 640;
  const H = 240;
  const M = { top: 20, right: 16, bottom: 36, left: 56 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const maxRaw = Math.max(...(values.length ? values : [0]), 0);

  // lep "step" za prihod
  const step = Math.max(1, Math.ceil(maxRaw / 5));
  const maxY = Math.max(step, Math.ceil(maxRaw / step) * step);

  const n = Math.max(values.length, 1);
  const barW = innerW / n;

  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= maxY; t += step) out.push(t);
    return out;
  }, [maxY, step]);

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

      {values.length === 0 ? (
        <div style={{ opacity: 0.7, fontSize: 13 }}>Nema podataka.</div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="220">
          {/* grid + y labels */}
          {ticks.map((t) => {
            const y = M.top + (1 - t / (maxY || 1)) * innerH;
            return (
              <g key={t}>
                <line x1={M.left} y1={y} x2={W - M.right} y2={y} stroke="rgba(255,255,255,0.08)" />
                <text x={M.left - 8} y={y + 4} fontSize={11} fill="rgba(255,255,255,0.65)" textAnchor="end">
                  {t}
                </text>
              </g>
            );
          })}

          {/* bars */}
          {values.map((v, i) => {
            const h = (v / (maxY || 1)) * innerH;
            const x = M.left + i * barW + barW * 0.15;
            const y = M.top + (innerH - h);
            const w = barW * 0.7;

            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(80,220,130,0.9)" />
                <text x={x + w / 2} y={y - 8} fontSize={11} fill="rgba(255,255,255,0.85)" textAnchor="middle">
                  {v.toFixed(0)}
                  {valueSuffix ?? ""}
                </text>
                <text x={x + w / 2} y={H - 12} fontSize={11} fill="rgba(255,255,255,0.65)" textAnchor="middle">
                  {labels[i] ?? ""}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
