import React, { useEffect, useMemo, useRef, useState } from "react";
import { salesAPI } from "../api/sales/SalesAPI";
import { PerfumeDTO } from "../models/sales/PerfumeDTO";
import { OrderItemDTO } from "../models/sales/OrderItemDTO";
import ProductCard from "../components/sales/ProductCard";
import CartSidebar from "../components/sales/CartView";
import CheckoutModal from "./CheckoutModal";
import { PaymentType } from "../types/PaymentType";

type Message = {
  type: "success" | "error" | "info";
  text: string;
};

const MessageBanner: React.FC<{ msg: Message; onClose: () => void }> = ({ msg, onClose }) => {
  const bg = msg.type === "success" ? "#ecfccb" : msg.type === "error" ? "#fee2e2" : "#eff6ff";
  const color = msg.type === "success" ? "#365314" : msg.type === "error" ? "#991b1b" : "#1e3a8a";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: bg, color, marginBottom: 12, border: "1px solid rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 14 }}>{msg.text}</div>
      <button onClick={onClose} style={{ marginLeft: 12, background: "transparent", border: "none", cursor: "pointer", color }}>
        ✕
      </button>
    </div>
  );
};

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<PerfumeDTO[]>([]);
  const [cart, setCart] = useState<OrderItemDTO[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("GOTOVINA");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const messageTimerRef = useRef<number | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const list = await salesAPI.listProducts();
        setProducts(list || []);
      } catch (e: any) {
        setError(e?.message ?? "Greška pri učitavanju proizvoda");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!message) return;
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
      messageTimerRef.current = null;
    }, 3000);

    return () => {
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, [message]);

  const showMessage = (m: Message) => {
    setMessage(m);
  };

  const addToCart = (p: PerfumeDTO, qty: number) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productId === p.id);
      if (found) {
        return prev.map((i) =>
          i.productId === p.id
            ? { ...i, quantity: Math.min((p.stock ?? 9999), i.quantity + qty) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: p.id!,
          name: p.name,
          price: p.price,
          quantity: qty,
          stock: p.stock,
        },
      ];
    });
    showMessage({ type: "info", text: `Dodato ${qty} x ${p.name} u korpu.` });
  };

  const updateQty = (productId: number, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    const removed = cart.find((c) => c.productId === productId);
    setCart((prev) => prev.filter((i) => i.productId !== productId));
    if (removed) showMessage({ type: "info", text: `Uklonjeno ${removed.name} iz korpe.` });
  };

  const totalPrice = useMemo(
    () => cart.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Korpa je prazna");
      return;
    }
    if (!customerName.trim()) {
      alert("Unesite ime kupca");
      return;
    }
    if (!deliveryAddress.trim()) {
      alert("Unesite adresu isporuke");
      return;

    }

    const items = cart.map((i) => ({
      perfumeId: i.productId,
      quantity: i.quantity,
      price: i.price,
      name: i.name,
    }));

    const dto = {
      customerName: customerName.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items,
      paymentType,
      totalPrice,
    };

    try {
      setLoading(true);
      const response: any = await salesAPI.createOrder(dto);
      const serial = response?.serial ?? response?.id ?? null;
      showMessage({ type: "success", text: `Porudžbina uspješno kreirana! Broj porudžbine: ${serial ?? "n/a"}` });

      setProducts((prev) =>
        prev.map((p) => {
          const cartItem = cart.find((c) => c.productId === p.id);
          if (!cartItem) return p;
          return {
            ...p,
            stock: Math.max(0, (p.stock ?? 0) - cartItem.quantity),
          };
        })
      );

      setCart([]);
      setCustomerName("");
      setDeliveryAddress("");
      setPaymentType("GOTOVINA");
      nameRef.current?.focus();
      setCheckoutOpen(false); 
    } catch (e: any) {
      showMessage({ type: "error", text: e?.message ?? "Greška pri kreiranju porudžbine" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 28, height: "calc(100vh - 20px)", boxSizing: "border-box", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 2000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, height: "calc(100vh - 76px)" }}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", color: "white", padding: 10, fontWeight: 700, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 18 }}>Katalog parfema</div>
            <div style={{ fontSize: 14 }}>{products.length} proizvoda</div>
          </div>

          <div style={{ padding: 18, overflow: "auto", flex: 1, minHeight: 0 }}>
            {message && <MessageBanner msg={message} onClose={() => setMessage(null)} />}

            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 6 }}>{error}</div>}
            {loading && <div>Učitavanje...</div>}
            {!loading && products.length === 0 && !error && <div>Nema proizvoda</div>}

            {products.map((p) => (
              <div key={p.id} style={{ marginBottom: 16, minWidth: 280 }}>
                <ProductCard product={p} onAdd={(qty) => addToCart(p, qty)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, minHeight: 0 }}>
          <div style={{ padding: 12, fontWeight: 700, display: "flex", justifyContent: "space-between", background: "linear-gradient(135deg, #93c5fd, #60a5fa)", color: "white", borderRadius: "8px 8px 0 0", alignItems: "center" }}>
            <div style={{ fontSize: 16 }}>Korpa ({cart.reduce((s, c) => s + c.quantity, 0)})</div>
            <div style={{ fontSize: 15 }}>Total: {totalPrice.toLocaleString()} RSD</div>
          </div>

          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              {/* U glavnom prikazu korpe više ne prikazujemo polja za ime/adresu/plaćanje -
                  to je sada u checkout modal-u. Ovdje je samo lista stavki. */}
              <div>
                <label style={{ display: "block", marginBottom: 8 }}>Stavke u korpi</label>
                <CartSidebar
                  items={cart}
                  onInc={(id) => {
                    const it = cart.find((c) => c.productId === id);
                    if (!it) return;
                    updateQty(id, it.quantity + 1);
                  }}
                  onDec={(id) => {
                    const it = cart.find((c) => c.productId === id);
                    if (!it) return;
                    updateQty(id, it.quantity - 1);
                  }}
                  onRemove={removeFromCart}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              gap: 12,
              padding: 16,
              borderTop: "1px solid rgba(0,0,0,0.06)",
              zIndex: 20,
              alignItems: "center",
              borderRadius: "0 0 8px 8px",
            }}
          >
            <button
              onClick={() => {
                setCart([]);
                showMessage({ type: "info", text: "Korpa je ispražnjena." });
              }}
              disabled={cart.length === 0 || loading}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                cursor: cart.length === 0 ? "not-allowed" : "pointer",
                fontSize: 14,
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
              }}
              aria-label="Isprazni korpu"
              title="Isprazni"
            >
              Isprazni
            </button>

 <button
  onClick={() => setCheckoutOpen(true)}
  disabled={cart.length === 0 || loading}
  aria-label="Naruči"
  title="Naruči"
  style={{
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: cart.length === 0
      ? "linear-gradient(135deg, rgba(52,211,153,0.22), rgba(16,185,129,0.18))"
      : "linear-gradient(135deg, #34d399, #10b981)",
    color: "#fff",
    cursor: cart.length === 0 || loading ? "not-allowed" : "pointer",
    backdropFilter: "blur(6px)",
    boxShadow: cart.length === 0 ? "none" : "0 8px 20px rgba(16,185,129,0.12)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
    opacity: cart.length === 0 ? 0.6 : 1,
  }}
  onMouseEnter={(e) => {
    if (!(cart.length === 0 || loading)) {
      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 30px rgba(16,185,129,0.16)";
    }
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
    (e.currentTarget as HTMLButtonElement).style.boxShadow = cart.length === 0 ? "none" : "0 8px 20px rgba(16,185,129,0.12)";
  }}
>
  Naruči
</button>


          </div>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        totalPrice={totalPrice}
        customerName={customerName}
        setCustomerName={setCustomerName}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        onInc={updateQty}
        onDec={updateQty}
        onRemove={removeFromCart}
        onConfirm={handleCheckout}
        loading={loading}
        nameRef={nameRef}
      />
    </div>
  );
};

export default SalesPage;
