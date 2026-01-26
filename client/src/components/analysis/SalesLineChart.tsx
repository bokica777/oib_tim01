import React, { useMemo } from "react";

type Props = {
  title: string;
  labels: string[];
  values: number[];
  valueSuffix?: string;
  yStep?: number; // npr 10
};

export const SalesLineChart: React.FC<Props> = ({ title, labels, values, valueSuffix, yStep }) => {
  const W = 640;
  const H = 240;

  const M = { top: 20, right: 16, bottom: 36, left: 48 };
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;

  const safeValues = values.length ? values : [0];
  const maxRaw = Math.max(...safeValues, 0);

  const step = yStep ?? Math.max(1, Math.ceil(maxRaw / 5));
  const maxY = Math.max(step, Math.ceil(maxRaw / step) * step);

  const n = Math.max(values.length, 1);

  const points = useMemo(() => {
    if (!values.length) return [];
    return values.map((v, i) => {
      const x = M.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = M.top + (1 - v / (maxY || 1)) * innerH;
      return { x, y, v, label: labels[i] ?? "" };
    });
  }, [values, labels, n, innerW, innerH, maxY]);

  const pathD = useMemo(() => {
    if (!points.length) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

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

          {/* x axis labels */}
          {labels.map((lab, i) => {
            const x = M.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
            return (
              <text
                key={i}
                x={x}
                y={H - 12}
                fontSize={11}
                fill="rgba(255,255,255,0.65)"
                textAnchor="middle"
              >
                {lab}
              </text>
            );
          })}

          {/* line */}
          <path d={pathD} fill="none" stroke="rgba(120,180,255,0.95)" strokeWidth={2.5} />

          {/* points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="rgba(120,180,255,1)" />
              <circle cx={p.x} cy={p.y} r={7} fill="rgba(120,180,255,0.12)" />
              <text
                x={p.x}
                y={p.y - 10}
                fontSize={11}
                fill="rgba(255,255,255,0.8)"
                textAnchor="middle"
              >
                {p.v}
                {valueSuffix ?? ""}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
};
