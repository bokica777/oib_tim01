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
    <div
      style={{
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        padding: 16
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 14
        }}
      >
        <button
          className="btn btn-accent"
          onClick={onSendFirst}
          disabled={items.length === 0 || sending}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            borderRadius: 8
          }}
        >
          {sending ? "Šaljem..." : "Pošalji prvu"}
        </button>
      </div>


      {/* LISTA */}
      {items.length === 0 ? (
        <div
          style={{
            opacity: 0.6,
            fontSize: 14,
            padding: 12,
            textAlign: "center"
          }}
        >
          Nema lokalno spakovanih ambalaža
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(p => {
            const warehouseName =
              warehouses?.find(w => String(w.id) === String(p.warehouseId))
                ?.name ?? p.warehouseId;

            const perfumeLabel =
              perfumeNames?.[p.id] ??
              (p.perfumeId ? String(p.perfumeId) : "-");

            return (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                {/* GORNJI RED */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    {formatDate(p.createdAt)}
                  </div>
                </div>

                {/* INFO GRID */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                    fontSize: 13,
                    opacity: 0.9
                  }}
                >
                  <div>
                    <strong>Parfem:</strong> {perfumeLabel}
                  </div>

                  <div>
                    <strong>Zapremina:</strong>{" "}
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.08)",
                        fontSize: 12
                      }}
                    >
                      {p.volume ? `${p.volume} ml` : "-"}
                    </span>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>Skladište (cilj):</strong>{" "}
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.08)",
                        fontSize: 12
                      }}
                    >
                      {warehouseName}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

};

export default LocalPackageList;
