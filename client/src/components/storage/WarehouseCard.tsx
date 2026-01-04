// src/components/storage/WarehouseCard.tsx
import React from "react";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type Props = {
  warehouse: WarehouseDTO;
  selected?: boolean;
  onShow: (id: string) => void;
  onShowAll: () => void;
};

const WarehouseCard: React.FC<Props> = ({ warehouse, selected, onShow, onShowAll }) => {
  const pct =
    warehouse.capacityUsed && warehouse.capacity
      ? Math.min(100, Math.round((warehouse.capacityUsed / warehouse.capacity) * 100))
      : 0;

  // Robust fallback for location/address naming differences
  const loc =
    (warehouse as any).location ??
    (warehouse as any).address ??
    (warehouse as any).addressLine ??
    undefined;

  return (
    <div
      className="warehouse-card"
      style={{
        border: selected ? "1px solid rgba(96,165,250,0.8)" : undefined,
        padding: 10,
        borderRadius: 6,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{warehouse.name}</div>
          {/* optional small line under name:
              {loc && <div style={{ fontSize: 12, opacity: 0.8 }}>{loc}</div>} */}
        </div>

        <div style={{ textAlign: "right", minWidth: 110 }}>
          <div style={{ fontSize: 12 }}>
            {warehouse.capacityUsed} / {warehouse.capacity}
          </div>
          {/* small, truncated address under capacity */}
          {loc && (
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                marginTop: 6,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 140,
              }}
            >
              {loc}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 6,
              background: "linear-gradient(90deg,#f97316,#fb923c)",
              transition: "width 0.25s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{pct}% popunjeno</div>
      </div>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => onShow(warehouse.id)}>
          Prikaži ambalažu
        </button>
        <button className="btn" onClick={onShowAll}>
          Prikaži sve
        </button>
      </div>
    </div>
  );
};

export default WarehouseCard;
