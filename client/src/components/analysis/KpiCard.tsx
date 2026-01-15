import React from "react";

type Props = {
  title: string;
  value: React.ReactNode;
  suffix?: string;
  hint?: string;
};

export const KpiCard: React.FC<Props> = ({ title, value, suffix, hint }) => {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        background: "rgba(255,255,255,0.04)",
        minHeight: 86,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{title}</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{value}</div>
        {suffix ? <div style={{ fontSize: 13, opacity: 0.7 }}>{suffix}</div> : null}
      </div>

      {hint ? <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>{hint}</div> : null}
    </div>
  );
};
