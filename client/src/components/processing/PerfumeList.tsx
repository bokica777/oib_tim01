import React from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO"; 

type Props = {
  perfumes: PerfumeDTO[];
  loading: boolean;
  onSelect: (p: PerfumeDTO | null) => void;
  onReserve: (name: string, count: number) => void;
};

export const PerfumeList: React.FC<Props> = ({ perfumes, loading, onSelect, onReserve }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>AVAILABLE</strong>
        <button className="btn" onClick={() => onReserve(prompt("Ime parfema za rezervaciju:") || "", Number(prompt("Koliko zelite rezervisati?") || 0))}>Reserve</button>
      </div>

      {loading && <div>Učitavanje…</div>}

      {!loading && perfumes.length === 0 && <div style={{ opacity: 0.7 }}>Trenutno nema dostupnih parfema.</div>}

      <div style={{ display: "grid", gap: 8 }}>
        {perfumes.map(p => (
          <div key={p.id} className="card" style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div onClick={() => onSelect(p)} style={{ cursor: "pointer" }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{p.netVolumeMl} ml — {p.type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12 }}>{p.serialNumber ?? ""}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{new Date(p.createdAt ?? "").toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
