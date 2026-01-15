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

const PackagingTable: React.FC<Props> = ({ items, warehouses, selected, onToggle, perfumeNames }) => {
  const hasSelection = typeof onToggle === "function";

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {hasSelection && <th style={{ width: 36 }} />}
          <th>Kod</th>
          <th>Pošiljalac</th>
          <th>Skladište</th>
          <th>Parfem</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={hasSelection ? 6 : 5} style={{ padding: 12, opacity: 0.7 }}>
              Nema spakovanih ambalaža.
            </td>
          </tr>
        )}

        {items.map(pkg => {
          const warehouse = warehouses.find(w => String(w.id) === String(pkg.warehouseId));
          const sender = pkg.senderAddress ?? pkg.name ?? "Centar za pakovanje";

          const perfumeLabel =
            perfumeNames?.[pkg.id] ??
            (pkg.perfumeId ? String(pkg.perfumeId) : (Array.isArray(pkg.perfumeIds) && pkg.perfumeIds.length ? String(pkg.perfumeIds[0]) : "-"));

          const code = pkg.serialNumber ?? pkg.id ?? pkg.name ?? "-";
          const status = pkg.status ?? "PACKED";

          return (
            <tr key={pkg.id}>
              {hasSelection && (
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selected ? selected.has(pkg.id) : false}
                    onChange={() => onToggle && onToggle(pkg.id)}
                  />
                </td>
              )}

              <td>{code}</td>
              <td>{sender}</td>
              <td>{warehouse?.name ?? "Nepoznato"}</td>
              <td>{perfumeLabel}</td>
              <td>{status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default PackagingTable;
