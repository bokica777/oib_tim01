import React, { useState } from "react";
import { PerfumeDTO } from "../../models/sales/PerfumeDTO";

type Props = {
  product: PerfumeDTO;
  onAdd: (qty: number) => void;
};

const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  const [qty, setQty] = useState<number>(1);
  const safePrice = typeof product.price === "number" ? product.price : 0;

  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, padding: 12, background: "#fff" }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#000" }}>{product.name}</div>

       <div style={{ fontSize: 12, opacity: 0.8, color: "#000" }}>
        {product.netVolumeMl ? `${product.netVolumeMl} ml` : ""}
      </div>

      <div style={{ color: "#10b981", fontWeight: 700, fontSize: 16, marginTop: 4 }}>
        {safePrice.toLocaleString()} РСД
      </div>

      <div style={{ fontSize: 12, marginTop: 4, color: "#000" }}>Na stanju: {product.stock ?? 0}</div>

      <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="number"
          min={1}
          max={product.stock ?? 9999}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          style={{ width: 60, padding: 4, borderRadius: 4, border: "1px solid rgba(0,0,0,0.12)" }}
        />
        <button
          style={{ flex: 1, background: "#3b82f6", color: "white", border: "none", borderRadius: 4, padding: "6px 0" }}
          onClick={() => onAdd(qty)}
          disabled={(product.stock ?? 0) <= 0}
          aria-label={`Dodaj ${product.name} u korpu`}
        >
          Dodaj u korpu
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
