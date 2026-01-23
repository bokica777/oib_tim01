import React, { useEffect, useRef, useState } from "react";
import PackagingForm from "../components/packaging/PackagingForm";
import LocalPackageList from "../components/packaging/LocalPackageList";
import { PerfumeDTO } from "../models/processing/PerfumeDTO";
import { WarehouseDTO } from "../models/storage/WarehouseDTO";
import { StoragePackageDTO } from "../models/storage/StoragePackageDTO";
import PackagingTable from "../components/packaging/PackageTable";
import { saveLocalPackagesToStorage } from "../helpers/SaveLocalPackagesToStorage";
import { loadLocalPackagesFromStorage } from "../helpers/LoadLocalPackagesFromStorage";
import { Message } from "../types/Message";

const GATEWAY_ROOT = (import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000");

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};


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

export const PackagingPage: React.FC = () => {
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [storagePackages, setStoragePackages] = useState<StoragePackageDTO[]>([]);
  const [localPackages, setLocalPackages] = useState<StoragePackageDTO[]>(() => loadLocalPackagesFromStorage());
  const [perfumeNames, setPerfumeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const [message, setMessage] = useState<Message | null>(null);
  const messageTimerRef = useRef<number | null>(null);

  const log = (text: string) => console.debug("[PackagingPage] " + text);

  useEffect(() => {
    saveLocalPackagesToStorage(localPackages);
  }, [localPackages]);

  useEffect(() => { loadAll(); }, []);

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

  const loadAll = async () => {
    setLoading(true);
    try {
      try {
        const r = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() });
        if (r.ok) {
          const data = await r.json();
          setPerfumes(Array.isArray(data) ? data : []);
        } else {
          setPerfumes([]);
        }
      } catch {
        setPerfumes([]);
      }

      try {
        const r = await fetch(`${GATEWAY_ROOT}/storage/warehouses`, { headers: authHeaders() });
        if (r.ok) {
          const data = await r.json();
          setWarehouses(Array.isArray(data) ? data : []);
        } else {
          setWarehouses([]);
        }
      } catch {
        setWarehouses([]);
      }

      await reloadStoragePackages();
    } finally {
      setLoading(false);
    }
  };

  const reloadStoragePackages = async () => {
    try {
      const r = await fetch(`${GATEWAY_ROOT}/storage/packages`, { headers: authHeaders() });
      if (r.ok) {
        const raw: any[] = await r.json();
        const pkgs: StoragePackageDTO[] = raw.map((p: any) => ({
          id: String(p.id ?? p.serialNumber ?? p.code ?? Math.random().toString()),
          name: p.name ?? (p.serialNumber ?? `Package ${p.id ?? ""}`),
          senderAddress: p.senderAddress ?? p.sender ?? "Centar za pakovanje",
          warehouseId: String(p.warehouseId ?? p.warehouse?.id ?? ""),
          perfumeId: p.perfumeId,
          status: (p.status ?? "PACKED") as "PACKED" | "SENT" | "STORED",
          serialNumber: p.serialNumber ?? undefined,
          createdAt: p.createdAt ? String(p.createdAt) : undefined,
          volume: p.volume ?? p.netVolumeMl ?? undefined,
        }));
        setStoragePackages(pkgs);

        const map: Record<string, string> = {};
        raw.forEach((p: any) => {
          const pid = String(p.id ?? p.serialNumber ?? p.code ?? "");
          const maybeId = p.perfumeId;
          if (maybeId) {
            const pf = perfumes.find(pp => Number(pp.id) === Number(maybeId));
            map[pid] = pf ? pf.name : String(maybeId);
          } else if (p.perfumeName) {
            map[pid] = String(p.perfumeName);
          }
        });
        setPerfumeNames(map);
      } else {
        log(`[WARN] /storage/packages ${r.status}`);
      }
    } catch (err) {
      log(`[ERR] load packages: ${(err as any).message ?? err}`);
    }
  };

  const handlePackAndCreateLocal = async (perfumeName: string, bottles: number, volumePerBottle: 150 | 250, warehouseId: number) => {
    if (!perfumeName || !warehouseId || bottles <= 0) { showMessage({ type: "error", text: "Neispravan unos" }); return; }
    setProcessing(true);
    try {
      const rAvail = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() });
      if (!rAvail.ok) { showMessage({ type: "error", text: "Greška pri proveri dostupnosti parfema." }); setProcessing(false); return; }
      const availData: any[] = await rAvail.json();
      const getVolume = (it: any) => Number(it.netVolumeMl ?? it.volume ?? it.netVolume ?? 0);
      const availableMatching = availData.filter(it =>
        (it.name === perfumeName || it.perfumeName === perfumeName) &&
        getVolume(it) === Number(volumePerBottle) &&
        ((it.status ?? "AVAILABLE") === "AVAILABLE")
      );
      if ((availableMatching?.length ?? 0) < bottles) {
        showMessage({ type: "error", text: `Nema dovoljno parfema sa imenom "${perfumeName}" i zapreminom ${volumePerBottle} ml (dostupno: ${availableMatching.length}).` });
        setProcessing(false);
        return;
      }
      const r1 = await fetch(`${GATEWAY_ROOT}/processing/perfumes/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: perfumeName, count: bottles }),
      });

      if (!r1.ok) {
        const errBody = await r1.json().catch(() => ({}));
        showMessage({ type: "error", text: `Ne mogu rezervisati parfeme: ${errBody?.message ?? r1.statusText}` });
        setProcessing(false);
        return;
      }

      const reserved = await r1.json();
      const reservedIds: number[] = Array.isArray(reserved) ? reserved.map((x: any) => Number(x.id)).filter(Boolean) : [];
      if (reservedIds.length === 0) {
        showMessage({ type: "info", text: "Rezervacija je bila prazna." });
        setProcessing(false);
        return;
      }
      const createdLocal: StoragePackageDTO[] = reservedIds.map((rid) => {
        const pkg: StoragePackageDTO = {
          id: `local-${rid}-${Date.now()}`,
          name: `Pakovanje-${perfumeName}-${rid}`,
          senderAddress: "Centar za pakovanje",
          warehouseId: String(warehouseId),
          perfumeId: Number(rid),
          status: "PACKED",
          createdAt: new Date().toISOString(),
          volume: Number(volumePerBottle),
        };
        return pkg;
      });

      setLocalPackages(prev => {
        const next = [...createdLocal, ...prev];
        saveLocalPackagesToStorage(next);
        return next;
      });

      createdLocal.forEach(p => log(`Local package created id=${p.id} perfumeId=${p.perfumeId} (${p.volume ?? "-"} ml)`));

      try { const r = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() }); if (r.ok) setPerfumes(await r.json()); } catch { }

      await reloadStoragePackages();
      showMessage({ type: "success", text: "Pakovanje kreirano lokalno. Pošalji u skladište kada budeš spremna." });
    } catch (err: any) {
      console.error(err);
      showMessage({ type: "error", text: "Greška pri pakovanju — pogledaj konzolu." });
    } finally {
      setProcessing(false);
    }
  };

  const sendFirstLocalToStorage = async () => {
    if (localPackages.length === 0) { showMessage({ type: "info", text: "Nema lokalno spakovanih ambalaža." }); return; }
    setSending(true);
    try {
      const first = localPackages[localPackages.length - 1];
      const storeDto: any = {
        name: String(first.name ?? "Pakovanje").trim(),
        senderAddress: String(first.senderAddress ?? "Centar za pakovanje").trim(),
        warehouseId: Number(first.warehouseId),
      };
      if (typeof first.perfumeId !== "undefined" && first.perfumeId !== null) {
        const pid = Number(first.perfumeId);
        if (Number.isFinite(pid) && pid > 0) storeDto.perfumeId = Math.trunc(pid);
      }

      const r = await fetch(`${GATEWAY_ROOT}/storage/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken") ?? ""}`
        },
        body: JSON.stringify(storeDto),
      });

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        showMessage({ type: "error", text: `Slanje nije uspelo: ${errBody?.message ?? r.statusText}` });
        setSending(false);
        return;
      }

      const saved = await r.json();
      log(`Package stored: id=${saved.id ?? saved.serialNumber}`);

      setLocalPackages(prev => {
        const next = prev.filter(p => p.id !== first.id);
        saveLocalPackagesToStorage(next);
        return next;
      });

      await reloadStoragePackages();
      showMessage({ type: "success", text: "Ambalaža uspešno poslata u skladište." });
    } catch (err: any) {
      log(`[ERR] sendFirstLocalToStorage: ${err?.message ?? err}`);
      showMessage({ type: "error", text: "Greška pri slanju u skladište." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Učitavanje podataka za pakovanje…</div>;

  return (
    <div style={{ padding: 12, height: "calc(100vh - 60px)", boxSizing: "border-box" }}>
      {message && <MessageBanner msg={message} onClose={() => setMessage(null)} />}

      <div style={{ display: "grid", gridTemplateColumns: "360px 360px 1fr", gap: 12, height: "100%", minHeight: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#fb923c,#f97316)" }}>
            Paketovanje parfema
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            <PackagingForm perfumes={perfumes} warehouses={warehouses} onPack={handlePackAndCreateLocal} processing={processing} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#22c55e,#16a34a)" }}>
            Lokalno spakovana ambalaža
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            <LocalPackageList items={localPackages} perfumeNames={perfumeNames} warehouses={warehouses} onSendFirst={sendFirstLocalToStorage} sending={sending} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#06b6d4,#0891b2)" }}>
            Skladište — Paketi
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            {storagePackages.length === 0 ? (
              <div>Nema paketa u skladištu.</div>
            ) : (
              <PackagingTable
                items={storagePackages}
                warehouses={warehouses}
                perfumeNames={perfumeNames}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagingPage;
