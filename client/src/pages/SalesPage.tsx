import React, { useEffect, useMemo, useRef, useState } from "react";
import { salesAPI } from "../api/sales/SalesAPI";
import { PerfumeDTO } from "../models/sales/PerfumeDTO";
import { OrderItemDTO } from "../models/sales/OrderItemDTO";
import ProductCard from "../components/sales/ProductCard";
import CartSidebar from "../components/sales/CartView";

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<PerfumeDTO[]>([]);
  const [cart, setCart] = useState<OrderItemDTO[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const list = await salesAPI.listProducts();
        console.log("Loaded products:", list);
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
    setCart(prev => {
      const found = prev.find(i => i.productId === p.id);
      if (found) {
        return prev.map(i =>
          i.productId === p.id
            ? { ...i, quantity: Math.min((p.stock ?? 9999), i.quantity + qty) }
            : i
        );
      }
      return [...prev, { productId: p.id!, name: p.name, price: (p as any).price ?? 0, quantity: qty, stock: (p as any).stock }];
    });
  };

  const updateQty = (productId: number, qty: number) => {
    setCart(prev =>
      prev
        .map(i => (i.productId === productId ? { ...i, quantity: qty } : i))
        .filter(i => i.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const total = useMemo(() => cart.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0), [cart]);
  const handleCheckout = async () => {
    if (cart.length === 0) { alert("Korpa je prazna"); return; }
    if (!customerName.trim()) { alert("Unesite ime kupca"); return; }
    if (!deliveryAddress.trim()) { alert("Unesite adresu isporuke"); return; }

    const count = cart.reduce((s, i) => s + i.quantity, 0);

    const dto = {
      customerName: customerName.trim(),
      deliveryAddress: deliveryAddress.trim(),
      count, // <-- backend expects this
    };

    try {
      setLoading(true);
      const response: any = await salesAPI.createOrder(dto); // tip izvanično možeš prilagoditi
      const serial = response?.serial ?? response?.id ?? null;
      alert(`Porudžbina uspješno kreirana! Broj porudžbine: ${serial ?? "n/a"}`);

      setCart([]);
      setCustomerName("");
      setDeliveryAddress("");
      nameRef.current?.focus();
    } catch (e: any) {
      alert(e?.message ?? "Greška pri kreiranju porudžbine");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ padding: 12, height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 12, flex: 1, minHeight: 0 }}>
        {/* Catalog */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ background: "#16a34a", color: "white", padding: 12, fontWeight: 700, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
            <div>Каталог парфема</div>
            <div>{products.length} proizvoda</div>
          </div>

          <div style={{ padding: 12, overflow: "auto", flex: 1 }}>
            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 8, borderRadius: 6 }}>{error}</div>}
            {loading && <div>Učitavanje...</div>}
            {!loading && products.length === 0 && !error && <div>Nema proizvoda</div>}
            {products.map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <ProductCard product={p} onAdd={qty => addToCart(p, qty)} />
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, minHeight: 0 }}>
          <div style={{ padding: 12, fontWeight: 700, display: "flex", justifyContent: "space-between", background: "#3b82f6", color: "white", borderRadius: "8px 8px 0 0" }}>
            <div>Korpa ({cart.reduce((s,c) => s+c.quantity,0)})</div>
            <div>Total: {total.toLocaleString()} РСД</div>
          </div>

          <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Ime kupca</label>
                <input
                  ref={nameRef}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  type="text"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid rgba(0,0,0,0.12)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Adresa isporuke</label>
                <input
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  type="text"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid rgba(0,0,0,0.12)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Stavke u korpi</label>
                <CartSidebar
                  items={cart}
                  onInc={(id) => {
                    const it = cart.find(c => c.productId === id);
                    if (!it) return;
                    updateQty(id, it.quantity + 1);
                  }}
                  onDec={(id) => {
                    const it = cart.find(c => c.productId === id);
                    if (!it) return;
                    updateQty(id, it.quantity - 1);
                  }}
                  onRemove={removeFromCart}
                />
              </div>
            </div>
          </div>

          {/* Sticky footer with actions */}
          <div
            style={{
              position: "sticky",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              gap: 8,
              padding: 12,
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
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fef2f2",
                color: "#991b1b",
                cursor: cart.length === 0 ? "not-allowed" : "pointer",
              }}
              aria-label="Isprazni korpu"
              title="Isprazni"
            >
              Isprazni
            </button>

            <button
              style={{
                flex: 1,
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "10px 14px",
                cursor: cart.length === 0 || loading ? "not-allowed" : "pointer",
              }}
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              aria-label="Zavrsi kupovinu"
              title="Završi kupovinu"
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
