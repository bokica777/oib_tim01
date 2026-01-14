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
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.3)",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        borderRadius: 12,
        padding: 16,
        minWidth: 390,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, color: "#fff" }}>{product.name}</div>
          {product.netVolumeMl && (
            <div style={{ fontSize: 12, opacity: 0.8, color: "#fff", marginTop: 2 }}>
              {product.netVolumeMl} ml
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>
            {safePrice.toLocaleString()} РСД
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, color: "#fff" }}>
            Na stanju: {product.stock ?? 0}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="number"
          min={1}
          max={product.stock ?? 9999}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          style={{ width: 60, padding: 4, borderRadius: 4, border: "1px solid rgba(0,0,0,0.12)" }}
        />
        <button
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #34d399, #10b981)",
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "6px 0",
          }}
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
