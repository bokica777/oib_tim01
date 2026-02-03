import React, { useEffect, useMemo, useRef, useState } from "react";
import { storageAPI } from "../api/storage/StorageAPIClient";
import WarehouseCard from "../components/storage/WarehouseCard";
import PackagingTable from "../components/storage/PackagingTable";
import { WarehouseDTO } from "../models/storage/WarehouseDTO";
import { PackagingDTO } from "../models/storage/PackagingDTO";
import { Message } from "../types/Message";
import { getUserRoleFromToken } from "../helpers/GetUserRoleFromToken";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const DISTRIBUTION = { max: 3, msPerItem: 500, label: "Centralno skladište (Distribucioni centar)" };
const WAREHOUSE = { max: 1, msPerItem: 2500, label: "Južno skladište (Magacinski centar)" };


const MessageBanner: React.FC<{ msg: Message; onClose: () => void }> = ({ msg, onClose }) => {
  const bg = msg.type === "success" ? "#ecfccb" : msg.type === "error" ? "#fee2e2" : "#eff6ff";
  const color = msg.type === "success" ? "#365314" : msg.type === "error" ? "#991b1b" : "#1e3a8a";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        background: bg,
        color,
        marginBottom: 12,
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 14 }}>{msg.text}</div>
      <button
        onClick={onClose}
        style={{ marginLeft: 12, background: "transparent", border: "none", cursor: "pointer", color }}
        aria-label="Zatvori obaveštenje"
      >
        ✕
      </button>
    </div>
  );
};

export const StoragePage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [packaging, setPackaging] = useState<PackagingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [sendCount, setSendCount] = useState<number>(1);
  const [sending, setSending] = useState(false);
  const roleRaw = getUserRoleFromToken();
  const role = roleRaw ? roleRaw.replace("ROLE_", "").toLowerCase() : null;

  const center = role === "sales_manager" ? DISTRIBUTION : role === "seller" ? WAREHOUSE : null;

  const [message, setMessage] = useState<Message | null>(null);
  const messageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadAll();
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

  const showMessage = (m: Message) => setMessage(m);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pkgs, whs] = await Promise.all([
        storageAPI.listPackages(),
        storageAPI.listWarehouses(),
      ]);

      setPackaging(pkgs ?? []);
      setWarehouses(whs ?? []);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Greška pri učitavanju.");
    } finally {
      setLoading(false);
    }
  };


  const handleSend = async () => {
    if (!center) {
      showMessage({ type: "error", text: "Nemate pristup: prijavite se kao Menadžer prodaje ili Prodavac" });
      return;
    }
    if (!Number.isInteger(sendCount) || sendCount <= 0) {
      showMessage({ type: "error", text: "Neispravan broj" });
      return;
    }
    if (sendCount > center.max) {
      showMessage({ type: "error", text: `Za vašu ulogu maksimum je ${center.max}` });
      return;
    }

    try {
      setSending(true);

      const totalMs = sendCount * center.msPerItem;
      const ticks = Math.max(1, Math.floor(totalMs / 200));
      for (let i = 0; i < ticks; i++) {
        await sleep(Math.ceil(totalMs / ticks));
      }

      const res = await storageAPI.requestSend({ count: sendCount });
      console.log(`Uspešno poslato ${sendCount} ambalaža`, res);
      showMessage({ type: "success", text: `Uspešno poslato ${sendCount} ambalaža.` });
      await loadAll();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Slanje nije uspelo";
      setError(msg);
      showMessage({ type: "error", text: msg });
    } finally {
      setSending(false);
    }
  };

  const filteredPackaging = useMemo(() => {
    if (!selectedWarehouse) return packaging;
    return packaging.filter((p) => {
      const wid = (p as any).warehouseId ?? (p as any).warehouse?.id ?? null;
      return wid ? String(wid) === selectedWarehouse : false;
    });
  }, [packaging, selectedWarehouse]);

  const totalCount = packaging.reduce((s, p) => s + (Number(p.count ?? 0) || 0), 0);


  const selectedWarehouseObj = warehouses.find((w) => w.id === selectedWarehouse) ?? null;
  const displayTitle = selectedWarehouseObj ? `Ambalaža — ${selectedWarehouseObj.name}` : "Ambalaža — Sva skladišta";
  const displaySubtitle = selectedWarehouseObj
    ? `${selectedWarehouseObj.capacityUsed} / ${selectedWarehouseObj.capacity} (${Math.round(
      (selectedWarehouseObj.capacity > 0 ? (selectedWarehouseObj.capacityUsed / selectedWarehouseObj.capacity) * 100 : 0)
    )}% )`
    : `${totalCount} artikala u sistemu`;

  if (loading) return <div style={{ padding: 20 }}>Učitavanje skladišta…</div>;

  return (
    <div
      className="overlay-blur-none"
      style={{ padding: 12, height: "calc(100vh - 60px)", boxSizing: "border-box" }}
    >
      {message && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            width: "min(520px, calc(100% - 32px))",
          }}
        >
          <MessageBanner msg={message} onClose={() => setMessage(null)} />
        </div>
      )}


      <style>{`
        /* Layout */
        .stk-window { height: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 0; }
        .stk-left, .stk-center { display: flex; flex-direction: column; min-height: 0; }

        /* Titlebars */
        .titlebar { height: 48px; display: flex; align-items: center; padding: 0 12px; border-radius: 8px; font-weight: 700; color: #fff; }
        .stk-left .titlebar { background: linear-gradient(90deg,#fb923c,#f97316); }
        .stk-center .titlebar { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
        .titlebar-title { font-size: 14px; }

        /* Panels */
        .window-content { padding: 12px; overflow: auto; flex: 1 1 auto; min-height: 0; background: rgba(255,255,255,0.01); border-radius: 6px; }
        .warehouse-card { border: 1px solid rgba(255,255,255,0.04); padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.02) }
        .pack-table { width: 100%; border-collapse: collapse; font-size: 13px }
        .pack-table thead th { padding: 8px; text-align: left; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05) }
        .pack-table tbody td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.03) }
        .status-pill { padding: 6px 10px; border-radius: 8px; font-size: 12px; }
        .status-stored { background: #bbf7d0; color: #064e3b }
        .status-sent { background: #dbeafe; color: #1e293b }

        /* Small helpers */
        .left-list { display:flex; flex-direction: column; gap:12px; }
        .muted { opacity: 0.8; font-size: 13px; }
      `}</style>

      <div className="window stk-window">
        <div className="stk-left">
          <div className="titlebar">
            <span className="titlebar-title">Skladišta</span>
          </div>

          <div className="window-content">
            {warehouses.length === 0 && !loading && (
              <div style={{ opacity: 0.7 }}>Nema podataka o skladištima.</div>
            )}

            <div className="left-list">
              {warehouses.map((w) => (
                <WarehouseCard
                  key={w.id}
                  warehouse={w}
                  selected={selectedWarehouse === w.id}
                  onShow={(id) => setSelectedWarehouse(id)}
                  onShowAll={() => setSelectedWarehouse(null)}
                />
              ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
              Uloga: <strong>{role ?? "Nepoznata"}</strong>
            </div>
          </div>
        </div>

        <div className="stk-center">
          <div className="titlebar">
            <span className="titlebar-title">{displayTitle}</span>
            <div style={{ fontSize: 12, opacity: 0.85, marginLeft: 12 }}>{displaySubtitle}</div>
          </div>

          <div className="window-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>{displayTitle}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  value={sendCount}
                  onChange={(e) => setSendCount(Number(e.target.value))}
                  style={{ width: 80 }}
                  min={1}
                />
                <button className="btn btn-accent" onClick={handleSend} disabled={sending || !center}>
                  {sending ? "Šaljem..." : "Pošalji prodaji"}
                </button>
              </div>
            </div>

            {selectedWarehouseObj && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>
                  <strong>{selectedWarehouseObj.name}</strong> {selectedWarehouseObj.location ? `— ${selectedWarehouseObj.location}` : ""}
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                  <div
                    style={{
                      width: `${Math.round(
                        selectedWarehouseObj.capacity > 0
                          ? (selectedWarehouseObj.capacityUsed / selectedWarehouseObj.capacity) * 100
                          : 0
                      )}%`,
                      height: "100%",
                      borderRadius: 6,
                      background: "linear-gradient(90deg,#60a5fa,#34d399)",
                      transition: "width 200ms ease",
                    }}
                  />
                </div>
              </div>
            )}

            <PackagingTable
              items={filteredPackaging}
              warehouses={warehouses}
            />

            {error && <div style={{ marginTop: 12, color: "#ef4444" }}>{error}</div>}

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
              <div>
                Ukupno ambalaža u sistemu: <strong>{totalCount}</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                Napomena: backend treba da validira ulogu iz tokena i primenjuje ograničenja (max po zahtevu i vreme nabavke).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoragePage;
