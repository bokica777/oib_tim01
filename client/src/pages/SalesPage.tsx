import React, { useEffect, useMemo, useRef, useState } from "react";
import { salesAPI } from "../api/sales/SalesAPI";
import { CreateOrderDTO } from "../models/sales/CreateOrderDTO";
import ProductCard from "../components/sales/ProductCard";
import CartSidebar from "../components/sales/CartView";
import CheckoutModal from "./CheckoutModal";
import { PaymentType } from "../types/PaymentType";
import { OrderItemDTO } from "../models/sales/OrderItemDTO";
import { CartItem } from "../models/sales/CartItem";
import { Message } from "../types/Message";
import { LocalPerfume } from "../models/sales/LocalPerfume";

const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<LocalPerfume[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("GOTOVINA");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await salesAPI.listProducts();
      setProducts(list);
    } catch (e: any) {
      console.error("loadProducts error", e);
      setError(e?.message ?? "Greška pri učitavanju proizvoda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      loadProducts();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!message) return;
    if (messageTimerRef.current) window.clearTimeout(messageTimerRef.current);
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

  const showMessage = (m: Message) => setMessage(m);

  const addToCart = async (p: LocalPerfume, qty: number, volume?: number) => {
    try {
      const chosenVolume = Number(volume ?? p.netVolumeMl ?? 150);
      const variant = p.variants.find(v => Number(v.volume) === Number(chosenVolume));

      if (!variant || typeof variant.id === "undefined" || isNaN(Number(variant.id))) {
        showMessage({ type: "error", text: `Nema spakovane varijante za ${chosenVolume} ml (${p.name}).` });
        return;
      }

      const availableStock = variant.stock ?? 0;
      
      const existingInCart = cart.find(
        i => i.productId === Number(variant.id) && Number(i.volume) === Number(chosenVolume)
      );
      const alreadyInCart = existingInCart?.quantity ?? 0;
      
      if (availableStock < qty + alreadyInCart) {
        showMessage({ 
          type: "error", 
          text: `Nedovoljno na stanju za ${p.name} (${chosenVolume} ml). Dostupno: ${availableStock}, u korpi: ${alreadyInCart}` 
        });
        return;
      }

      const usedPerfumeId = Number(variant.id);
      const usedPrice = Math.round(typeof variant.price === "number" ? variant.price : (chosenVolume * 50));

      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === usedPerfumeId && Number(i.volume) === Number(chosenVolume));
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { 
            ...copy[idx], 
            quantity: copy[idx].quantity + qty
          };
          return copy;
        }
        return [...prev, { 
          productId: usedPerfumeId, 
          name: p.name, 
          price: usedPrice, 
          quantity: qty, 
          stock: availableStock,
          volume: chosenVolume 
        }];
      });

      showMessage({ type: "info", text: `Dodato ${qty} x ${p.name} (${chosenVolume} ml) u korpu.` });
    } catch (err: any) {
      console.error("addToCart failed", err);
      showMessage({ type: "error", text: err?.message ?? "Greška pri dodavanju u korpu" });
    }
  };

  const updateQty = (productId: number, qty: number) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    const removed = cart.find(c => c.productId === productId);
    setCart(prev => prev.filter(i => i.productId !== productId));
    if (removed) {
      showMessage({ type: "info", text: `Uklonjeno ${removed.name} (${removed.volume ?? ""} ml) iz korpe.` });
    }
  };

  const totalPrice = useMemo(() => cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0), [cart]);

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

    const items: OrderItemDTO[] = cart.map(i => ({
      perfumeId: Number(i.productId),
      price: Math.round(i.price),
      quantity: i.quantity,
      name: i.name,
    }) as any);

    const dto: any = {
      customerName: customerName.trim(),
      deliveryAddress: deliveryAddress.trim(),
      items,
      paymentType,
      totalPrice,
    } as any as CreateOrderDTO;

    try {
      setLoading(true);

      const res: any = await salesAPI.createOrder(dto);
      showMessage({ type: "success", text: `Porudžbina kreirana (${res?.serial ?? res?.id ?? "?"}).` });

      await loadProducts();

      setCart([]);
      setCustomerName("");
      setDeliveryAddress("");
      setPaymentType("GOTOVINA");
      nameRef.current?.focus();
      setCheckoutOpen(false);
      
    } catch (e: any) {
      console.error("checkout failed", e);
      
      const errorMsg = e?.response?.data?.message || e?.message || "Greška pri kreiranju porudžbine";
      showMessage({ type: "error", text: errorMsg });
      
      await loadProducts();
      
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStock = (productId: number, volume: number): number => {
    const product = products.find(p => 
      p.variants?.some(v => Number(v.id) === productId && Number(v.volume) === volume)
    );
    
    if (!product) return 0;
    
    const variant = product.variants?.find(v => 
      Number(v.id) === productId && Number(v.volume) === volume
    );
    
    const totalStock = variant?.stock ?? 0;
    const inCart = cart.find(c => c.productId === productId && Number(c.volume) === volume)?.quantity ?? 0;
    
    return Math.max(0, totalStock - inCart);
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
            {message && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ 
                  padding: 12, 
                  borderRadius: 8, 
                  background: message.type === "success" ? "#ecfccb" : message.type === "error" ? "#fee2e2" : "#eff6ff", 
                  color: message.type === "success" ? "#365314" : message.type === "error" ? "#991b1b" : "#1e3a8a" 
                }}>
                  {message.text}
                </div>
              </div>
            )}

            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 6 }}>{error}</div>}
            {loading && <div>Učitavanje...</div>}
            {!loading && products.length === 0 && !error && <div>Nema proizvoda</div>}

            {products.map((p) => (
              <div key={String(p.id)} style={{ marginBottom: 16, minWidth: 280 }}>
                <ProductCard
                  product={{
                    id: Number(p.id) || p.id,
                    name: p.name,
                    netVolumeMl: p.netVolumeMl,
                    price: p.price,
                    stock: p.stock,
                    variants: p.variants,
                  } as any}
                  onAdd={(qty: number, volume?: number) => addToCart(p, qty, volume)}
                />
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
              <div>
                <label style={{ display: "block", marginBottom: 8 }}>Stavke u korpi</label>
                <CartSidebar
                  items={cart.map(c => ({ 
                    productId: c.productId, 
                    name: c.name, 
                    price: c.price, 
                    quantity: c.quantity, 
                    stock: c.stock, 
                    volume: c.volume 
                  })) as any}
                  onInc={(id) => {
                    const it = cart.find((c) => c.productId === id);
                    if (!it) return;
                    
                    const available = getAvailableStock(id, it.volume ?? 0);
                    if (available > 0) {
                      updateQty(id, it.quantity + 1);
                    } else {
                      showMessage({ type: "error", text: "Nema više dostupnih jedinica" });
                    }
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

          <div style={{ position: "sticky", bottom: 0, left: 0, right: 0, display: "flex", gap: 12, padding: 16, borderTop: "1px solid rgba(0,0,0,0.06)", zIndex: 20, alignItems: "center", borderRadius: "0 0 8px 8px" }}>
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
                transition: "transform 0.2s, box-shadow 0.2s, background 0.2s" 
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
                opacity: cart.length === 0 ? 0.6 : 1 
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
        cart={cart.map(c => ({ 
          productId: c.productId, 
          name: c.name, 
          price: c.price, 
          quantity: c.quantity, 
          stock: c.stock, 
          volume: c.volume 
        })) as any}
        totalPrice={totalPrice}
        customerName={customerName}
        setCustomerName={setCustomerName}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        onInc={(id, qty) => updateQty(id, qty)}
        onDec={(id, qty) => updateQty(id, qty)}
        onRemove={removeFromCart}
        onConfirm={handleCheckout}
        loading={loading}
        nameRef={nameRef}
      />
    </div>
  );
};

export default SalesPage;