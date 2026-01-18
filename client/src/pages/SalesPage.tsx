import React, { useEffect, useMemo, useRef, useState } from "react";
import { salesAPI } from "../api/sales/SalesAPI";
import { PerfumeDTO } from "../models/sales/PerfumeDTO";
import { OrderItemDTO } from "../models/sales/OrderItemDTO";
import ProductCard from "../components/sales/ProductCard";
import CartSidebar from "../components/sales/CartView";
import { PaymentType } from "../types/PaymentType"; 

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<PerfumeDTO[]>([]);
  const [cart, setCart] = useState<OrderItemDTO[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("GOTOVINA");

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
          stock: (p as any).stock,
        },
      ];
    });
  };

  const updateQty = (productId: number, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
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
    
    }));

    const dto = {
      customerName: customerName.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items,
      paymentType,
    };

    try {
      setLoading(true);
      const response: any = await salesAPI.createOrder(dto);
      const serial = response?.serial ?? response?.id ?? null;
      alert(`Porudžbina uspješno kreirana! Broj porudžbine: ${serial ?? "n/a"}`);

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
    } catch (e: any) {
      alert(e?.message ?? "Greška pri kreiranju porudžbine");
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
            <div style={{ fontSize: 15 }}>Total: {totalPrice.toLocaleString()} РСД</div>
          </div>

          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8 }}>Ime kupca</label>
                <input
                  ref={nameRef}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  type="text"
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8 }}>Adresa isporuke</label>
                <input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  type="text"
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8 }}>Начин плаћања</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: 14 }}
                >
                  <option value="GOTOVINA">Готовина</option>
                  <option value="RACUN">Уплата на рачун</option>
                  <option value="KARTICA">Картично плаћање</option>
                </select>
              </div>

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
              onClick={() => setCart([])}
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
              onMouseEnter={(e) => {
                if (!(cart.length === 0 || loading)) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              }}
            >
              Isprazni
            </button>

            <button
              style={{
                flex: 1,
                borderRadius: 6,
                border: "1px solid rgba(59,130,246,0.3)",
                background: "rgba(59,130,246,0.1)",
                color: "#fff",
                padding: "14px 16px",
                fontSize: 15,
                cursor: cart.length === 0 || loading ? "not-allowed" : "pointer",
                backdropFilter: "blur(6px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s, background 0.2s",
              }}
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              aria-label="Zavrsi kupovinu"
              title="Završi kupovinu"
              onMouseEnter={(e) => {
                if (!(cart.length === 0 || loading)) {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.1)";
              }}
            >
              {loading ? "Slanje..." : "Završi kupovinu"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
