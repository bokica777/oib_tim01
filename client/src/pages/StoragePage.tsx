import React, { useEffect, useMemo, useState } from "react";
import { storageAPI } from "../api/storage/StorageAPIClient";
import WarehouseCard from "../components/storage/WarehouseCard";
import PackagingTable from "../components/storage/PackagingTable";
import StorageLog from "../components/storage/StorageLog";
import { WarehouseDTO } from "../models/storage/WarehouseDTO";
import { PackagingDTO } from "../models/storage/PackagingDTO";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function getUserRoleFromToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || payload.userRole || payload.authorities?.[0] || null;
  } catch {
    return null;
  }
}

class AuditAPI {
  base = "/api/audit";
  async record(event: { type: string; message: string; meta?: any }, token?: string) {
    try {
      await fetch(`${this.base}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(event),
      });
    } catch (e) {
      console.warn("Audit error", e);
    }
  }
}

const auditAPI = new AuditAPI();

const DISTRIBUTION = { max: 3, msPerItem: 500, label: "Centralno skladište (Distribucioni centar)" };
const WAREHOUSE = { max: 1, msPerItem: 2500, label: "Južno skladište (Magacinski centar)" };

export const StoragePage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [packaging, setPackaging] = useState<PackagingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [sendCount, setSendCount] = useState<number>(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<PackagingDTO | null>(null);

  const token = localStorage.getItem("accessToken") ?? "";
  const roleRaw = getUserRoleFromToken();
  const role = roleRaw ? roleRaw.replace("ROLE_", "").toLowerCase() : null;

  const center = role === "sales_manager" ? DISTRIBUTION : role === "seller" ? WAREHOUSE : null;

  useEffect(() => {
    loadAll();
  }, []);

  const pushLog = async (text: string, sendAudit = false, meta?: any) => {
    const line = `${new Date().toLocaleString()} — ${text}`;
    setLogs((s) => [line, ...s].slice(0, 200));
    if (sendAudit) await auditAPI.record({ type: "storage", message: text, meta }, token);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const pkgs = await storageAPI.listPackages();
      setPackaging(pkgs || []);
      try {
        if (typeof storageAPI.listWarehouses === "function") {
          const whFromApi = await storageAPI.listWarehouses();
          const mapped = (whFromApi || []).map((w: any) => ({
            id: String(w.id ?? ""),
            name: w.name ?? `Skladište ${w.id ?? ""}`,
            location: w.location ?? w.address ?? undefined,
            capacity: Number(w.capacity ?? w.capacityTotal ?? 0),
            capacityUsed: Number(w.usedCapacity ?? w.capacityUsed ?? 0),
          })) as WarehouseDTO[];
          setWarehouses(mapped);
          return;
        }
        throw new Error("listWarehouses not available");
      } catch (err) {
        console.warn("listWarehouses failed, falling back to derive from packages", err);
      }

      const map = new Map<string, WarehouseDTO>();
      const DEFAULT_CAPACITY = 100;

      (pkgs || []).forEach((p: any) => {
        const wid = p.warehouseId ?? p.warehouse?.id ?? null;
        if (!wid && p.warehouse?.id == null) return;
        const id = String(wid ?? p.warehouse?.id);
        if (!map.has(id)) {
          const name = p.warehouseName ?? p.warehouse?.name ?? `Skladište ${id}`;
          const location = p.warehouse?.location ?? undefined;
          map.set(id, {
            id,
            name,
            location,
            capacity: DEFAULT_CAPACITY,
            capacityUsed: 0,
          } as WarehouseDTO);
        }
      });

      const counts: Record<string, number> = {};
      (pkgs || []).forEach((p: any) => {
        const wid = String(p.warehouseId ?? p.warehouse?.id ?? "");
        if (!wid) return;
        const status = (p.status ?? "STORED").toString().toUpperCase();
        if (status === "SENT") return;
        const qty = Number(p.count ?? p.quantity ?? 1) || 1;
        counts[wid] = (counts[wid] ?? 0) + qty;
      });

      for (const [id, w] of map.entries()) {
        (w as any).capacityUsed = counts[id] ?? 0;
      }

      setWarehouses(Array.from(map.values()));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Greška pri učitavanju.");
      await pushLog(`ERROR: ${e?.message ?? "load failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!center) {
      alert("Nemate pristup: prijavite se kao Menadžer prodaje ili Prodavac");
      return;
    }
    if (!Number.isInteger(sendCount) || sendCount <= 0) {
      alert("Neispravan broj");
      return;
    }
    if (sendCount > center.max) {
      alert(`Za vašu ulogu maksimum je ${center.max}`);
      return;
    }

    try {
      setSending(true);
      await pushLog(`Započinjem slanje ${sendCount} ambalaža preko ${center.label}`, true, { count: sendCount });

      const totalMs = sendCount * center.msPerItem;
      const ticks = Math.max(1, Math.floor(totalMs / 200));
      for (let i = 0; i < ticks; i++) {
        await sleep(Math.ceil(totalMs / ticks));
      }

      const res = await storageAPI.requestSend({ count: sendCount });
      await pushLog(`Uspešno poslato ${sendCount} ambalaža: ${res?.message ?? "ok"}`, true, { res });
      await loadAll();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Slanje nije uspelo");
      await pushLog(`FAIL slanje ${sendCount}: ${e?.message ?? "err"}`, true, { error: e?.message });
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

  const totalCount = packaging.reduce(
    (s, p) => s + (Number((p as any).count ?? (p as any).quantity ?? 0) || 0),
    0
  );

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
      <style>{`
        /* Layout */
        .stk-window { height: 100%; display: grid; grid-template-columns: 360px 1fr 360px; gap: 12; min-height: 0; }
        .stk-left, .stk-center, .stk-right { display: flex; flex-direction: column; min-height: 0; }

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
              onDetails={(p) => setSelectedPackage(p)}
            />

            {error && <div style={{ marginTop: 12, color: "#ef4444" }}>{error}</div>}
          </div>
        </div>

        <div className="stk-right">
          <div className="titlebar">
            <span className="titlebar-title">Detalji / Dnevnik</span>
          </div>

          <div className="window-content">
            {selectedPackage ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 6,
                }}
              >
                <h4 style={{ marginBottom: 6 }}>Detalji paketa:</h4>
                <div><strong>ID:</strong> {(selectedPackage as any).id}</div>
                <div><strong>Naziv:</strong> {(selectedPackage as any).name ?? (selectedPackage as any).label}</div>
                <div><strong>Količina:</strong> {(selectedPackage as any).count ?? (selectedPackage as any).quantity ?? 0}</div>
                <div><strong>Skladište:</strong> {(selectedPackage as any).warehouseName ?? (selectedPackage as any).warehouse?.name}</div>
                <div><strong>Status:</strong> {(selectedPackage as any).status}</div>
                {(selectedPackage as any).expiryDate && (
                  <div><strong>Rok trajanja:</strong> {(selectedPackage as any).expiryDate}</div>
                )}
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.7)" }}>
                Klikni na ambalažu levo da vidiš detalje.
              </div>
            )}

            <StorageLog logs={logs} />

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
