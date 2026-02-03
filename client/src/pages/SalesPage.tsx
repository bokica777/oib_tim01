import React, { useEffect, useMemo, useRef, useState } from "react";
import { salesAPI } from "../api/sales/SalesAPI";
import processingAPI from "../api/processing/ProcessingAPI";
import { CreateOrderDTO } from "../models/sales/CreateOrderDTO";
import { PerfumeType } from "../enums/processing/PerfumeType";
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

  useEffect(() => {
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

    loadProducts();
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
      setLoading(true);
      const chosenVolume = Number(volume ?? p.netVolumeMl ?? 150);

      const variant = p.variants.find(v => Number(v.volume) === Number(chosenVolume));

      let usedPerfumeId: number;
      let usedPrice: number;
      let resultingStock: number | undefined = undefined;

      if (variant && typeof variant.id !== "undefined" && !isNaN(Number(variant.id)) && (variant.stock ?? 0) >= qty) {
        usedPerfumeId = Number(variant.id);
        usedPrice = Math.round(typeof variant.price === "number" ? variant.price : ((variant.price ?? (chosenVolume * 50))));
        resultingStock = (variant.stock ?? 0) - qty;
      } else {
        const processReq = {
          perfumeName: p.name,
          type: PerfumeType.PERFUME,
          bottles: qty,
          volumePerBottle: chosenVolume,
        } as any;

        const produced: any[] = await processingAPI.processPerfume(processReq);
        if (!Array.isArray(produced) || produced.length === 0) {
          throw new Error("Prerada nije uspela");
        }

        usedPerfumeId = Number(produced[0].id) || Date.now();
        usedPrice = Math.round(typeof produced[0].price === "number" ? produced[0].price : (chosenVolume * 50));
        resultingStock = (produced.length ? produced.length - qty : 0);

        setProducts(prev => {
          const idx = prev.findIndex(x => x.name === p.name);
          if (idx >= 0) {
            const copy = [...prev];
            const ex = copy[idx];
            const vIdx = ex.variants.findIndex(v => Number(v.volume) === Number(chosenVolume));
            if (vIdx >= 0) {
              const v = { ...ex.variants[vIdx] };
              v.id = v.id ?? produced[0].id;
              v.price = v.price ?? produced[0].price ?? Math.round((produced[0].price ?? (chosenVolume * 50)));
              v.stock = (v.stock ?? 0) + produced.length;
              ex.variants[vIdx] = v;
            } else {
              ex.variants.unshift({ volume: chosenVolume, id: produced[0].id ?? `${p.name}-${chosenVolume}`, price: produced[0].price ?? usedPrice, stock: produced.length });
            }
            ex.stock = (ex.stock ?? 0) + produced.length;
            copy[idx] = { ...ex };
            return copy;
          }
          return [{ id: produced[0].id ?? `${p.name}-${chosenVolume}`, name: produced[0].name ?? p.name, netVolumeMl: chosenVolume, price: produced[0].price ?? usedPrice, stock: produced.length, variants: [{ volume: chosenVolume, id: produced[0].id, price: produced[0].price ?? usedPrice, stock: produced.length }] }, ...prev];
        });
      }
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === Number(usedPerfumeId) && Number(i.volume) === Number(chosenVolume));
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty, stock: resultingStock ?? copy[idx].stock };
          return copy;
        }
        return [...prev, { productId: Number(usedPerfumeId), name: p.name, price: usedPrice, quantity: qty, stock: resultingStock, volume: chosenVolume }];
      });

      showMessage({ type: "info", text: `Dodato ${qty} x ${p.name} (${chosenVolume} ml) u korpu.` });
    } catch (err: any) {
      console.error("addToCart failed", err);
      showMessage({ type: "error", text: err?.message ?? "Greška pri dodavanju u korpu" });
    } finally {
      setLoading(false);
    }
  };

  const updateQty = (productId: number, qty: number) => {
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i).filter(i => i.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    const removed = cart.find(c => c.productId === productId);
    setCart(prev => prev.filter(i => i.productId !== productId));
    if (removed) showMessage({ type: "info", text: `Uklonjeno ${removed.name} (${removed.volume ?? ""} ml) iz korpe.` });
  };

  const totalPrice = useMemo(() => cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) { alert("Korpa je prazna"); return; }
    if (!customerName.trim()) { alert("Unesite ime kupca"); return; }
    if (!deliveryAddress.trim()) { alert("Unesite adresu isporuke"); return; }

    const items: OrderItemDTO[] = cart.map(i => ({
      perfumeId: Number(i.productId),
      price: Math.round(i.price),
      quantity: i.quantity,
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
      showMessage({ type: "success", text: `Porudžbina kreirana (id=${res?.id ?? "?"}).` });

      setProducts(prev => prev.map(p => {
        const ci = cart.find(c => Number(c.productId) === Number(p.id) || p.variants.some(v => Number(v.id) === Number(c.productId)));
        if (!ci) return p;
        const variants = p.variants.map(v => {
          if (Number(v.id) === Number(ci.productId) || (Number(v.volume) === Number(ci.volume) && Number(v.id) === Number(ci.productId))) {
            return { ...v, stock: Math.max(0, (v.stock ?? 0) - ci.quantity) };
          }
          return v;
        });
        return { ...p, variants, stock: Math.max(0, (p.stock ?? 0) - ci.quantity) };
      }));

      setCart([]);
      setCustomerName("");
      setDeliveryAddress("");
      setPaymentType("GOTOVINA");
      nameRef.current?.focus();
      setCheckoutOpen(false);
    } catch (e: any) {
      console.error("checkout failed", e);
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
            {message && <div style={{ marginBottom: 12 }}><div style={{ padding: 12, borderRadius: 8, background: message.type === "success" ? "#ecfccb" : message.type === "error" ? "#fee2e2" : "#eff6ff", color: message.type === "success" ? "#365314" : message.type === "error" ? "#991b1b" : "#1e3a8a" }}>{message.text}</div></div>}

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
                  items={cart.map(c => ({ productId: c.productId, name: c.name, price: c.price, quantity: c.quantity, stock: c.stock, volume: c.volume })) as any}
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

          <div style={{ position: "sticky", bottom: 0, left: 0, right: 0, display: "flex", gap: 12, padding: 16, borderTop: "1px solid rgba(0,0,0,0.06)", zIndex: 20, alignItems: "center", borderRadius: "0 0 8px 8px" }}>
            <button onClick={() => { setCart([]); showMessage({ type: "info", text: "Korpa je ispražnjena." }); }} disabled={cart.length === 0 || loading} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: cart.length === 0 ? "not-allowed" : "pointer", fontSize: 14, backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s, background 0.2s" }} aria-label="Isprazni korpu" title="Isprazni">Isprazni</button>

            <button onClick={() => setCheckoutOpen(true)} disabled={cart.length === 0 || loading} aria-label="Naruči" title="Naruči" style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "none", background: cart.length === 0 ? "linear-gradient(135deg, rgba(52,211,153,0.22), rgba(16,185,129,0.18))" : "linear-gradient(135deg, #34d399, #10b981)", color: "#fff", cursor: cart.length === 0 || loading ? "not-allowed" : "pointer", backdropFilter: "blur(6px)", boxShadow: cart.length === 0 ? "none" : "0 8px 20px rgba(16,185,129,0.12)", transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease", opacity: cart.length === 0 ? 0.6 : 1 }}>
              Naruči
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart.map(c => ({ productId: c.productId, name: c.name, price: c.price, quantity: c.quantity, stock: c.stock, volume: c.volume })) as any}
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
