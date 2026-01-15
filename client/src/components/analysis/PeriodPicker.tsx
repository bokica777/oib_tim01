import React from "react";

export type PeriodUI = "month" | "week" | "year";

export const PeriodPicker: React.FC<{
  title: string;
  period: PeriodUI;
  from: string;
  to: string;
  loading: boolean;
  onChange: (p: PeriodUI) => void;
  onRefresh: () => void;
}> = ({ title, period, from, to, loading, onChange, onRefresh }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "end",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 10,
      }}
    >
      <div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Analitika prodaje i izveštaji.</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select value={period} onChange={(e) => onChange(e.target.value as PeriodUI)}>
          <option value="month">Mesečno</option>
          <option value="week">Nedeljno</option>
          <option value="year">Godišnje</option>
        </select>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {from} → {to}
        </div>

        <button onClick={onRefresh} disabled={loading}>
          {loading ? "Učitavam..." : "Osveži"}
        </button>
      </div>
    </div>
  );
};
