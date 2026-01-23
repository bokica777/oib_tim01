import React from "react";
import CartSidebar from "../components/sales/CartView";
import { PaymentType } from "../types/PaymentType";
import { CartItem } from "../models/sales/CartItem";

type Props = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalPrice: number;
  customerName: string;
  setCustomerName: (v: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  paymentType: PaymentType;
  setPaymentType: (v: PaymentType) => void;
    onInc: (productId: number, qty: number) => void;
    onDec: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  nameRef?: React.RefObject<HTMLInputElement | null>;
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: "min(900px, 96%)",
  maxHeight: "90vh",
  overflow: "auto",
  background: "#222",
  borderRadius: 10,
  boxShadow: "0 20px 60px rgba(2,6,23,0.4)",
  padding: 20,
};

const CheckoutModal: React.FC<Props> = ({
  open,
  onClose,
  cart,
  totalPrice,
  customerName,
  setCustomerName,
  deliveryAddress,
  setDeliveryAddress,
  paymentType,
  setPaymentType,
  onInc,
  onDec,
  onRemove,
  onConfirm,
  loading,
  nameRef,
}) => {
  if (!open) return null;

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-label="Checkout">
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Završi narudžbinu</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer" }} aria-label="Zatvori">✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Ime kupca</label>
              <input
                ref={nameRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                type="text"
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Adresa isporuke</label>
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                type="text"
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Način plaćanja</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
              >
                <option value="GOTOVINA">Gotovina</option>
                <option value="RACUN">Uplata na račun</option>
                <option value="KARTICA">Kartično plaćanje</option>
              </select>
            </div>

            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", marginBottom: 8 }}>Napomena (opcionalno)</label>
              <textarea style={{ width: "100%", minHeight: 100, padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
            </div>
          </div>

          <div style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", paddingLeft: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Pregled korpe</div>
            <div style={{ maxHeight: 420, overflow: "auto", marginBottom: 12 }}>
              <CartSidebar
                items={cart}
                onInc={(id) => {
                  const it = cart.find((c) => c.productId === id);
                  if (!it) return;
                  onInc(id, it.quantity + 1);
                }}
                onDec={(id) => {
                  const it = cart.find((c) => c.productId === id);
                  if (!it) return;
                  onDec(id, it.quantity - 1);
                }}
                onRemove={onRemove}
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>Ukupno</div>
                <div style={{ fontWeight: 700 }}>{totalPrice.toLocaleString()} RSD</div>
              </div>

              <button
                onClick={onConfirm}
                disabled={loading || cart.length === 0}
                style={{
                  width: "100%",
                  flex: 1,
                  background: loading
                    ? "linear-gradient(135deg, rgba(52,211,153,0.5), rgba(16,185,129,0.5))"
                    : "linear-gradient(135deg, #34d399, #10b981)",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "12px 0",
                  fontSize: 15,
                  cursor: loading || cart.length === 0 ? "not-allowed" : "pointer",
                }}
                aria-label="Završi kupovinu"
              >
                {loading ? "Slanje..." : "Završi kupovinu"}
              </button>

              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: "#fff",
                  color: "#111",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Nazad
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
