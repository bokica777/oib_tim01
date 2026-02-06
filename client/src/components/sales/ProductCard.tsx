import React, { useMemo, useState } from "react";
import { Variant } from "../../models/sales/Variant";

type Props = {
  product: {
    id: number | string;
    name: string;
    netVolumeMl?: number;
    price?: number;
    stock?: number;
    variants?: Variant[];
  };
  onAdd: (qty: number, volume: number) => void;
};

const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  const variants = product.variants && product.variants.length > 0
    ? product.variants.slice().sort((a, b) => a.volume - b.volume)
    : [{ volume: product.netVolumeMl ?? 150, id: product.id, price: product.price, stock: product.stock }];

  const defaultVolume = variants.some(v => v.volume === 250) ? 250 : variants[0].volume;

  const [qty, setQty] = useState<number>(1);
  const [volume, setVolume] = useState<number>(defaultVolume);

  const selectedVariant = useMemo(
    () => variants.find(v => Number(v.volume) === Number(volume)) ?? variants[0],
    [variants, volume]
  );

  const unitPricePerMl = useMemo(() => {
    if (selectedVariant && typeof selectedVariant.price === "number" && typeof selectedVariant.volume === "number") {
      return selectedVariant.price / selectedVariant.volume;
    }
    if (typeof product.price === "number" && typeof product.netVolumeMl === "number" && product.netVolumeMl > 0) {
      return product.price / product.netVolumeMl;
    }
    return 50;
  }, [selectedVariant, product]);

  const computedPrice = Math.round(unitPricePerMl * Number(volume));
  
  const availableStock = selectedVariant?.stock ?? 0;
  const hasEnoughStock = availableStock >= qty;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
        backdropFilter: "blur(6px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        borderRadius: 12,
        padding: 16,
        minWidth: 320,
        transition: "transform 0.18s, box-shadow 0.18s",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 14px 30px rgba(0,0,0,0.16)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{product.name}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#10b981", fontWeight: 700, fontSize: 18 }}>
            {computedPrice.toLocaleString()} RSD
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            <em style={{ opacity: 0.85 }}>Izabrana zapremina: {volume} ml</em>
          </div>

          {/* ✅ Prikaz stvarnog stanja */}
          <div style={{ 
            fontSize: 12, 
            opacity: 0.85, 
            marginTop: 6,
            color: availableStock > 0 ? "#10b981" : "#ef4444"
          }}>
            {availableStock > 0
              ? `Na stanju: ${availableStock}`
              : "Nema na stanju"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Zapremina
          <select
            aria-label="Izaberi zapreminu"
            value={volume}
            onChange={(e) => {
              const newVolume = Number(e.target.value);
              setVolume(newVolume);
              setQty(1);
            }}
            style={{
              width: 80,
              marginTop: 6,
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {variants.map(v => (
              <option key={String(v.volume)} value={v.volume}>
                {v.volume} ml
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", fontSize: 12 }}>
          Količina
          <input
            type="number"
            min={1}
            max={availableStock}
            value={qty}
            onChange={(e) => {
              const newQty = Math.max(1, Number(e.target.value) || 1);
              setQty(Math.min(newQty, availableStock));
            }}
            style={{
              marginTop: 6,
              padding: 8,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          />
        </label>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => onAdd(qty, volume)}
          aria-label={`Dodaj ${product.name} ${volume}ml u korpu`}
          disabled={!hasEnoughStock || availableStock === 0}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: (!hasEnoughStock || availableStock === 0)
              ? "#6b7280"
              : "linear-gradient(135deg, #34d399, #10b981)",
            color: "#fff",
            cursor: (!hasEnoughStock || availableStock === 0)
              ? "not-allowed"
              : "pointer",
            fontWeight: 700,
            minWidth: 140,
            opacity: (!hasEnoughStock || availableStock === 0) ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          title={availableStock === 0 ? "Nema na stanju" : !hasEnoughStock ? "Nedovoljno na stanju" : "Dodaj u korpu"}
        >
          {availableStock === 0 ? "Nema na stanju" : `Dodaj (${computedPrice.toLocaleString()} RSD)`}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;