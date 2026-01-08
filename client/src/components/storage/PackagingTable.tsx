import React from "react";
import { PackagingDTO } from "../../models/storage/PackagingDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type Props = {
  items: PackagingDTO[];
  warehouses: WarehouseDTO[];
  onDetails?: (item: PackagingDTO) => void;
};

const PackagingTable: React.FC<Props> = ({ items, warehouses, onDetails }) => {
  return (
    <table className="pack-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Pošiljalac</th>
          <th>Broj parfema</th>
          <th>Skladište</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
              Nema ambalaže za prikaz.
            </td>
          </tr>
        )}

        {items.map((p) => (
          <tr key={p.id}>
            <td>{p.code}</td>
            <td>Centar za pakovanje</td>
            <td>{p.count}</td>
            <td>
              {warehouses.find(w => w.id === p.warehouseId)?.name ?? "Nepoznato"}
            </td>
            <td>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  background: p.status === "SENT" ? "#dbeafe" : "#bbf7d0",
                  color: p.status === "SENT" ? "#1e293b" : "#064e3b",
                }}
              >
                {p.status ?? "STORED"}
              </span>
              {onDetails && (
                <button className="btn" onClick={() => onDetails(p)} style={{ marginLeft: 8 }}>
                  Detalji
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PackagingTable;
