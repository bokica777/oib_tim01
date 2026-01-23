import React from "react";
import { CartItem } from "../../models/sales/CartItem";

type Props = {
  items: CartItem[];
  onInc: (productId: number) => void;
  onDec: (productId: number) => void;
  onRemove: (productId: number) => void;
};

const btnBase: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#fff",
  cursor: "pointer",
  minWidth: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "#7f1d1d",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

const CartSidebar: React.FC<Props> = ({ items, onInc, onDec, onRemove }) => {
  if (!items || items.length === 0) return <div style={{ opacity: 0.7 }}>Korpa je prazna</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((i) => {
        const safePrice = typeof i.price === "number" ? i.price : 0;
        const lineTotal = safePrice * i.quantity;
        const canDec = i.quantity > 1;
        const canInc = i.quantity < (i.stock ?? 9999);

        return (
          <div key={`${i.productId}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i.name} {i.volume ? <span style={{ fontWeight: 500, fontSize: 12, opacity: 0.85 }}>({i.volume} ml)</span> : null}
              </div>
              <div style={{ opacity: 0.85, minWidth: 90, textAlign: "right" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{(i.price ?? 0).toLocaleString()} RSD / kom</div>
                <div style={{ fontWeight: 700 }}>{lineTotal.toLocaleString()} RSD</div>
              </div>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" aria-label={`Smanji količinu ${i.name}`} onClick={() => onDec(i.productId)} disabled={!canDec} style={{ ...(canDec ? btnBase : { ...btnBase, ...disabledStyle }) }} title="Smanji">−</button>

              <div style={{ minWidth: 36, textAlign: "center", background: "rgba(0,0,0,0.03)", padding: "6px 8px", borderRadius: 6 }}>{i.quantity}</div>

              <button type="button" aria-label={`Povećaj količinu ${i.name}`} onClick={() => onInc(i.productId)} disabled={!canInc} style={{ ...(canInc ? btnBase : { ...btnBase, ...disabledStyle }) }} title="Povećaj">+</button>

              <div style={{ flex: 1 }} />

              <button type="button" aria-label={`Ukloni ${i.name} iz korpe`} onClick={() => onRemove(i.productId)} style={btnDanger} title="Ukloni">Ukloni</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartSidebar;
