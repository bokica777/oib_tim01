import React from "react";
import { StoragePackageDTO } from "../../models/storage/StoragePackageDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type Props = {
  items: StoragePackageDTO[];
  perfumeNames?: Record<string, string>;
  warehouses?: WarehouseDTO[];
  onSendFirst: () => void;
  sending?: boolean;
};

const LocalPackageList: React.FC<Props> = ({ items, perfumeNames, warehouses, onSendFirst, sending }) => {
  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <strong>Napakovano (lokalno)</strong>
        <button className="btn" onClick={onSendFirst} disabled={items.length === 0 || sending}>
          {sending ? "Šaljem..." : "Pošalji prvu u skladište"}
        </button>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.04)", padding: 8, borderRadius: 6 }}>
        {items.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nema lokalno spakovanih ambalaža</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map(p => {
              const warehouseName = warehouses?.find(w => String(w.id) === String(p.warehouseId))?.name ?? p.warehouseId;
              const perfumeLabel = perfumeNames?.[p.id] ?? (p.perfumeId ? String(p.perfumeId) : '-');
              return (
                <li key={p.id} style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{formatDate(p.createdAt)}</div>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                    <div><strong>Parfem:</strong> {perfumeLabel}</div>
                    <div><strong>Zapremina:</strong> {p.volume ? `${p.volume} ml` : "-"}</div>
                    <div><strong>Skladište (cilj):</strong> {warehouseName}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocalPackageList;
