import React, { useEffect, useState } from "react";
import PackagingForm from "../components/packaging/PackagingForm";
import LocalPackageList from "../components/packaging/LocalPackageList";
import { PerfumeDTO } from "../models/processing/PerfumeDTO";
import { WarehouseDTO } from "../models/storage/WarehouseDTO";
import { StoragePackageDTO } from "../models/storage/StoragePackageDTO";

const GATEWAY_ROOT = (import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000");
const LOCAL_KEY = "localPackages_v1";

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
};

function loadLocalPackagesFromStorage(): StoragePackageDTO[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("Failed to parse localPackages from localStorage", e);
    return [];
  }
}

function saveLocalPackagesToStorage(pkgs: StoragePackageDTO[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(pkgs));
  } catch (e) {
    console.warn("Failed to save localPackages to localStorage", e);
  }
}

export const PackagingPage: React.FC = () => {
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [storagePackages, setStoragePackages] = useState<StoragePackageDTO[]>([]);
  const [localPackages, setLocalPackages] = useState<StoragePackageDTO[]>(() => loadLocalPackagesFromStorage());
  const [perfumeNames, setPerfumeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  // replaced 'pushLog' + logs state with simple console logger to keep behaviour but remove UI diary
  const log = (text: string) => {
    console.debug("[PackagingPage] " + text);
  };

  useEffect(() => {
    saveLocalPackagesToStorage(localPackages);
  }, [localPackages]);

  useEffect(() => { loadAll(); }, []); // run once on mount

  const loadAll = async () => {
    setLoading(true);
    try {
      try {
        const r = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() });
        if (r.ok) {
          const data = await r.json();
          setPerfumes(Array.isArray(data) ? data : []);
        } else {
          log(`[WARN] /processing/perfumes ${r.status}`);
          setPerfumes([]);
        }
      } catch (err) {
        log(`[ERR] load perfumes: ${(err as any).message ?? err}`);
        setPerfumes([]);
      }

      try {
        const r = await fetch(`${GATEWAY_ROOT}/storage/warehouses`, { headers: authHeaders() });
        if (r.ok) {
          const data = await r.json();
          setWarehouses(Array.isArray(data) ? data : []);
        } else {
          log(`[WARN] /storage/warehouses ${r.status}`);
          setWarehouses([]);
        }
      } catch (err) {
        log(`[ERR] load warehouses: ${(err as any).message ?? err}`);
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
          perfumeIds: Array.isArray(p.perfumeIds) ? p.perfumeIds.map((x: any) => Number(x)) : undefined,
          status: (p.status ?? "PACKED") as "PACKED" | "SENT" | "STORED",
          serialNumber: p.serialNumber ?? undefined,
          createdAt: p.createdAt ? String(p.createdAt) : undefined,
        }));
        setStoragePackages(pkgs);

        const map: Record<string, string> = {};
        raw.forEach((p: any) => {
          const pid = String(p.id ?? p.serialNumber ?? p.code ?? "");
          if (Array.isArray(p.perfumeIds) && p.perfumeIds.length) {
            const first = Number(p.perfumeIds[0]);
            const pf = perfumes.find(pp => Number(pp.id) === first);
            map[pid] = pf ? pf.name : String(first);
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

  const handlePackAndCreateLocal = async (perfumeName: string, bottles: number, volumePerBottle: 150|250, warehouseId: number) => {
    if (!perfumeName || !warehouseId || bottles <= 0) { alert("Neispravan unos"); return; }
    setProcessing(true);
    try {
      log(`Checking availability ${bottles}x "${perfumeName}" (${volumePerBottle} ml) in processing...`);

      const rAvail = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() });
      if (!rAvail.ok) {
        log(`[ERR] failed to fetch processing list: ${rAvail.status}`);
        alert("Greška pri proveri dostupnosti parfema.");
        setProcessing(false);
        return;
      }

      const availData: any[] = await rAvail.json();
      const getVolume = (it: any) => Number(it.netVolumeMl ?? it.volume ?? it.netVolume ?? 0);
      const availableMatching = availData.filter(it =>
        (it.name === perfumeName || it.perfumeName === perfumeName) &&
        getVolume(it) === Number(volumePerBottle) &&
        ((it.status ?? "AVAILABLE") === "AVAILABLE")
      );

      if ((availableMatching?.length ?? 0) < bottles) {
        log(`[WARN] Not enough available for ${perfumeName} ${volumePerBottle}ml: found=${availableMatching.length}`);
        alert(`Nema dovoljno parfema sa imenom "${perfumeName}" i zapreminom ${volumePerBottle} ml (dostupno: ${availableMatching.length}).`);
        setProcessing(false);
        return;
      }

      log(`Requesting reserve ${bottles}x "${perfumeName}" from processing...`);
      const r1 = await fetch(`${GATEWAY_ROOT}/processing/perfumes/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: perfumeName, count: bottles }),
      });

      if (!r1.ok) {
        const errBody = await r1.json().catch(() => ({}));
        log(`[ERR] processing reserve failed: ${r1.status} ${JSON.stringify(errBody)}`);
        alert(`Ne mogu rezervisati parfeme: ${errBody?.message ?? r1.statusText}`);
        setProcessing(false);
        return;
      }

      const reserved = await r1.json();
      const reservedIds: number[] = Array.isArray(reserved) ? reserved.map((x: any) => Number(x.id)).filter(Boolean) : [];
      if (reservedIds.length === 0) {
        log("[WARN] processing returned 0 reserved items");
        alert("Rezervacija je bila prazna.");
        setProcessing(false);
        return;
      }

      const createdLocal: StoragePackageDTO[] = reservedIds.map((rid) => {
        const pkg: StoragePackageDTO = {
          id: `local-${rid}-${Date.now()}`,
          name: `Pakovanje-${perfumeName}-${rid}`,
          senderAddress: "Centar za pakovanje",
          warehouseId: String(warehouseId),
          perfumeIds: [rid],
          status: "PACKED",
          createdAt: new Date().toISOString(),
          // @ts-ignore
          volume: Number(volumePerBottle),
        } as StoragePackageDTO;
        return pkg;
      });

      setLocalPackages(prev => {
        const next = [...createdLocal, ...prev];
        saveLocalPackagesToStorage(next);
        return next;
      });

      createdLocal.forEach(p => log(`Local package created id=${p.id} perfumeId=${p.perfumeIds?.[0]} (${(p as any).volume ?? "-"} ml)`));

      try {
        const r = await fetch(`${GATEWAY_ROOT}/processing/perfumes`, { headers: authHeaders() });
        if (r.ok) setPerfumes(await r.json());
      } catch {}

      await reloadStoragePackages();
      alert("Pakovanje kreirano lokalno. Pošalji u skladište kada budeš spremna.");
    } catch (err: any) {
      console.error(err);
      log(`[ERR] pack/createLocal failed: ${err?.message ?? err}`);
      alert("Greška pri pakovanju — pogledaj konzolu.");
    } finally {
      setProcessing(false);
    }
  };

  const sendFirstLocalToStorage = async () => {
    if (localPackages.length === 0) { alert("Nema lokalno spakovanih ambalaža."); return; }
    setSending(true);
    try {
      const first = localPackages[localPackages.length - 1]; // take oldest (we prepend new ones)
      const storeDto = {
        name: first.name,
        senderAddress: first.senderAddress,
        warehouseId: Number(first.warehouseId),
        perfumeIds: first.perfumeIds ?? [],
      };

      log(`Sending '${first.name}' to storage (perfumeId=${storeDto.perfumeIds.join(",")}) ...`);
      const r = await fetch(`${GATEWAY_ROOT}/storage/store`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(storeDto),
      });

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        log(`[ERR] storage.store failed: ${r.status} ${JSON.stringify(errBody)}`);
        alert(`Slanje nije uspelo: ${errBody?.message ?? r.statusText}`);
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
      alert("Ambalaža uspešno poslana u skladište.");
    } catch (err: any) {
      log(`[ERR] sendFirstLocalToStorage: ${err?.message ?? err}`);
      alert("Greška pri slanju u skladište.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Učitavanje podataka za pakovanje…</div>;

  return (
    <div style={{ padding: 12, height: "calc(100vh - 60px)", boxSizing: "border-box" }}>
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
              <div style={{ display: "grid", gap: 8 }}>
                {storagePackages.map((p) => (
                  <div key={p.id} style={{ padding: 10, borderRadius: 6, background: "rgba(0,0,0,0.12)" }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12 }}>{p.status} — {p.warehouseId ? `Warehouse ${p.warehouseId}` : "-"}</div>
                    {p.createdAt && <div style={{ fontSize: 11 }}>{new Date(p.createdAt).toLocaleString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagingPage;
