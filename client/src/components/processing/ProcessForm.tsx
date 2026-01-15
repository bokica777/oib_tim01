import React, { useEffect, useState } from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";
import { PerfumeType } from "../../enums/processing/PerfumeType";

type Props = {
  perfumes: PerfumeDTO[]; 
  onProcess: (dto: ProcessRequestDTO) => Promise<void>;
  processing?: boolean;
};

const GATEWAY_ROOT = (import.meta.env.VITE_GATEWAY_URL ?? "").replace(/\/$/, "");

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const tryFetchNames = async (): Promise<string[] | null> => {
  const candidatePaths = [
    "/processing/perfumes",        
    "/processing/perfumes/all",    
    "/processing/catalog",         
    "/catalog/perfumes",
    "/perfumes",
    "/perfumes/all"
  ];

  for (const path of candidatePaths) {
    if (!GATEWAY_ROOT) continue;
    const url = `${GATEWAY_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) continue;
      const data = await res.json();

      // normalize possible wrapper { items: [...] }
      const maybeArray = Array.isArray(data) ? data : (Array.isArray((data as any)?.items) ? (data as any).items : null);
      if (!Array.isArray(maybeArray)) continue;

      const names = maybeArray
        .map((it: any) => {
          if (typeof it === "string") return it;
          if (it == null) return "";
          return String(it.name ?? it.perfumeName ?? it.title ?? it.displayName ?? "");
        })
        .map((n: string) => n.trim())
        .filter((n: string) => n.length > 0);

      if (names.length > 0) {
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
      }
    } catch (err) {
      continue;
    }
  }

  return null;
};

const ProcessForm: React.FC<Props> = ({ perfumes, onProcess, processing }) => {
  const propNames = Array.from(new Set((perfumes ?? []).map(p => String(p.name ?? p.name ?? "")).filter(Boolean)));
  const [names, setNames] = useState<string[]>(propNames);
  const [loadingNames, setLoadingNames] = useState<boolean>(false);

  const [selectedName, setSelectedName] = useState<string>(propNames[0] ?? "");
  const [type, setType] = useState<PerfumeType>(PerfumeType.PERFUME);
  const [bottles, setBottles] = useState<number>(1);
  const [volumePerBottle, setVolumePerBottle] = useState<150 | 250>(150);

  useEffect(() => {
    if (!names || names.length === 0) {
      setNames(propNames);
    } else {
      const merged = Array.from(new Set([...names, ...propNames])).sort((a, b) => a.localeCompare(b));
      setNames(merged);
    }
  }, [perfumes]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingNames(true);
      try {
        const fetched = await tryFetchNames();
        if (!mounted) return;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const combined = Array.from(new Set([...fetched, ...propNames])).sort((a, b) => a.localeCompare(b));
          setNames(combined);
        } else {
          setNames(prev => {
            const fromProp = propNames;
            if (fromProp.length > 0 && JSON.stringify(prev) !== JSON.stringify(fromProp)) return fromProp;
            return prev;
          });
        }
      } finally {
        if (mounted) setLoadingNames(false);
      }
    })();
    return () => { mounted = false; };
  }, []); 
  useEffect(() => {
    if (names.length === 0) {
      setSelectedName("");
      return;
    }
    if (!selectedName || !names.includes(selectedName)) {
      setSelectedName(names[0]);
    }
  }, [names]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) {
      alert("Izaberi parfem iz liste.");
      return;
    }
    if (!Number.isInteger(bottles) || bottles <= 0) {
      alert("Neispravan broj boca.");
      return;
    }

    const dto: ProcessRequestDTO = {
      perfumeName: selectedName,
      type,
      bottles,
      volumePerBottle,
    };
    await onProcess(dto);
  };

  return (
    <form onSubmit={submit}>
      {/* Parfem */}
      <div style={{ marginBottom: 8 }}>
        <label>Parfem (ime)</label>
        <select
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
          style={{ width: "100%" }}
        >
          {loadingNames && names.length === 0 && <option value="">-- učitavanje imena... --</option>}
          {!loadingNames && names.length === 0 && <option value="">-- nema imena (fallback) --</option>}
          {names.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {loadingNames && <div style={{ fontSize: 12, marginTop: 6 }}>Povlačim ceo katalog parfema…</div>}
      </div>

      {/* Tip, Boca i Zapremina */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label>Tip</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as PerfumeType)}
            style={{ width: "100%" }}
          >
            <option value={PerfumeType.PERFUME}>PERFUME</option>
            <option value={PerfumeType.COLOGNE}>COLOGNE</option>
          </select>
        </div>

        <div style={{ width: 120 }}>
          <label>Boca</label>
          <input
            type="number"
            min={1}
            value={bottles}
            onChange={e => setBottles(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ width: 140 }}>
          <label>Zapremina</label>
          <select
            value={volumePerBottle}
            onChange={e => setVolumePerBottle(Number(e.target.value) as 150 | 250)}
            style={{ width: "100%" }}
          >
            <option value={150}>150 ml</option>
            <option value={250}>250 ml</option>
          </select>
        </div>
      </div>

      {/* Dugme */}
      <div>
        <button className="btn btn-accent" type="submit" disabled={processing}>
          {processing ? "Prerada..." : "Pokreni preradu"}
        </button>
      </div>
    </form>
  );
};

export default ProcessForm;
