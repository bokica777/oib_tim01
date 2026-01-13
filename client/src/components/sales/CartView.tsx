import React from "react";
import { OrderItemDTO } from "../../models/sales/OrderItemDTO";

type Props = {
  items: OrderItemDTO[];
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
  background: "rgba(254,226,226,0.15)", // providna, svjetlija ružičasta
  color: "#991b1b", // tamnocrvena za tekst
  border: "1px solid rgba(153,27,27,0.25)", // blaži obrub u skladu s providnom pozadinom
  backdropFilter: "blur(6px)", // da se uklopi s ostalim providnim dugmadima
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
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
          <div key={i.productId} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", paddingBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
              <div style={{ opacity: 0.85, minWidth: 90, textAlign: "right" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{(i.price ?? 0).toLocaleString()} РСД / kom</div>
                <div style={{ fontWeight: 700 }}>{lineTotal.toLocaleString()} РСД</div>
              </div>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                aria-label={`Smanji količinu ${i.name}`}
                onClick={() => onDec(i.productId)}
                disabled={!canDec}
                style={{ ...(canDec ? btnBase : { ...btnBase, ...disabledStyle }) }}
                title="Smanji"
              >
                −
              </button>

              <div
                style={{
                  minWidth: 36,
                  textAlign: "center",
                  background: "rgba(0,0,0,0.03)",
                  padding: "6px 8px",
                  borderRadius: 6,
                }}
              >
                {i.quantity}
              </div>

              <button
                type="button"
                aria-label={`Povećaj količinu ${i.name}`}
                onClick={() => onInc(i.productId)}
                disabled={!canInc}
                style={{ ...(canInc ? btnBase : { ...btnBase, ...disabledStyle }) }}
                title="Povećaj"
              >
                +
              </button>

              <div style={{ flex: 1 }} />

              <button
                type="button"
                aria-label={`Ukloni ${i.name} iz korpe`}
                onClick={() => onRemove(i.productId)}
                style={btnDanger}
                title="Ukloni"
              >
                Ukloni
              </button>
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
              Na stanju: {i.stock ?? 0}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartSidebar;
