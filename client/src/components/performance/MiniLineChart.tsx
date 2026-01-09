import React, { useMemo } from "react";

type Props = {
  title: string;
  subtitle?: string;
  values: number[];      // npr executionTime poslednjih 10 simulacija
  valueSuffix?: string;  // npr "s" ili "%"
};

export const MiniLineChart: React.FC<Props> = ({ title, subtitle, values, valueSuffix }) => {
  const width = 560;
  const height = 240;
  const pad = 28;

  const { min, max, path, lastValue } = useMemo(() => {
    const safe = (values?.length ? values : [0, 0, 0]).map((v) => (Number.isFinite(v) ? v : 0));
    const mn = Math.min(...safe);
    const mx = Math.max(...safe);
    const span = mx - mn || 1;

    const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, safe.length - 1);
    const y = (v: number) => height - pad - ((v - mn) * (height - pad * 2)) / span;

    const p = safe.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
    return { min: mn, max: mx, path: p, lastValue: safe[safe.length - 1] };
  }, [values]);

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
          {subtitle ?? `Poslednja vrednost: ${lastValue.toFixed(2)}${valueSuffix ?? ""}`}
        </div>
      </div>

      <div style={{ padding: 12 }}>
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* grid */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = pad + (i * (height - pad * 2)) / 4;
            return (
              <line
                key={i}
                x1={pad}
                y1={y}
                x2={width - pad}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          {/* frame */}
          <rect
            x={pad}
            y={pad}
            width={width - pad * 2}
            height={height - pad * 2}
            fill="transparent"
            stroke="rgba(255,255,255,0.12)"
          />

          {/* line */}
          <path d={path} fill="none" stroke="rgba(0,200,255,0.95)" strokeWidth="2.6" />

          {/* min/max labels */}
          <text x={pad} y={pad - 8} fill="rgba(255,255,255,0.6)" fontSize="12">
            max: {max.toFixed(2)}{valueSuffix ?? ""}
          </text>
          <text x={pad} y={height - 6} fill="rgba(255,255,255,0.6)" fontSize="12">
            min: {min.toFixed(2)}{valueSuffix ?? ""}
          </text>
        </svg>
      </div>
    </div>
  );
};
