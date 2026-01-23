import React from "react";
import { StoragePackageDTO } from "../../models/storage/StoragePackageDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type Props = {
  items: StoragePackageDTO[];
  warehouses: WarehouseDTO[];
  selected?: Set<string>;
  onToggle?: (id: string) => void;
  perfumeNames?: Record<string, string>;
};

const statusStyle = (status: string) => ({
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  display: "inline-block",
  background:
    status === "SENT"
      ? "rgba(59,130,246,0.15)"
      : status === "STORED"
        ? "rgba(34,197,94,0.18)"
        : "rgba(251,191,36,0.25)",
  color:
    status === "SENT"
      ? "#1e3a8a"
      : status === "STORED"
        ? "#065f46"
        : "#92400e",
});

const PackagingTable: React.FC<Props> = ({
  items,
  warehouses,
  selected,
  onToggle,
  perfumeNames,
}) => {
  const hasSelection = typeof onToggle === "function";

  if (items.length === 0) {
    return <div style={{ opacity: 0.7 }}>Nema spakovanih ambalaža.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map(pkg => {
        const warehouse =
          warehouses.find(w => String(w.id) === String(pkg.warehouseId))?.name ??
          "Nepoznato";

        const perfumeLabel =
          perfumeNames?.[pkg.id] ??
          (pkg.perfumeId ? String(pkg.perfumeId) : "-");

        const sender = pkg.senderAddress ?? "Centar za pakovanje";
        const code = pkg.serialNumber ?? pkg.id ?? "-";
        const status = pkg.status ?? "PACKED";

        return (
          <div
            key={pkg.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 12,
              borderRadius: 8,
              background: "rgba(0,0,0,0.12)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {hasSelection && (
              <input
                type="checkbox"
                checked={selected ? selected.has(pkg.id) : false}
                onChange={() => onToggle && onToggle(pkg.id)}
                style={{ marginTop: 4 }}
              />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {pkg.name ?? "Pakovanje"}
                </div>

                <span style={statusStyle(status)}>{status}</span>
              </div>

              {/* BODY */}
              <div style={{ fontSize: 13, opacity: 0.9, display: "grid", gap: 4 }}>
                <div>
                  <strong>Kod:</strong> {code}
                </div>
                <div>
                  <strong>Parfem:</strong> {perfumeLabel}
                </div>
                <div>
                  <strong>Skladište:</strong> {warehouse}
                </div>
                <div>
                  <strong>Pošiljalac:</strong> {sender}
                </div>
              </div>

              {/* FOOTER */}
              {pkg.createdAt && (
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
                  {new Date(pkg.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PackagingTable;
