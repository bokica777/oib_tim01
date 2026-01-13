// src/components/production/ProductionLog.tsx
import React, { useEffect, useMemo, useState } from "react";
import productionAPI from "../../api/production/ProductionAPI";
import { processingAPI } from "../../api/processing/ProcessingAPI";

type LogItem = {
  time: string;
  type: "ok" | "warn" | "error";
  text: string;
  sortTs: number;
};

export const ProductionLog: React.FC = () => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const POLL_MS = 2000;

  useEffect(() => {
    let mounted = true;
    let intervalId: number | undefined;

    const loadLogs = async () => {
      try {
        setError(null);
        setLoading(true);

        const [prodLogs, procLogs] = await Promise.all([
          productionAPI.getLogs(),
          processingAPI.getLogs(),
        ]);

        const combined = ([...(prodLogs ?? []), ...(procLogs ?? [])] as any[]).filter(Boolean);

        const mapped: LogItem[] = combined.map((l: any) => {
          const tsRaw = l.createdAt ?? l.timestamp ?? new Date().toISOString();
          const ts = Date.parse(tsRaw) || Date.now();
          const time = new Date(ts).toLocaleString();
          const t = (l.type ?? "INFO").toString().toUpperCase();
          const uiType: LogItem["type"] = t === "ERROR" ? "error" : t === "WARNING" ? "warn" : "ok";
          const parts: string[] = [];
          if (l.source) parts.push(`[${l.source}]`);
          parts.push(String(l.message ?? l.msg ?? JSON.stringify(l)));
          if (l.meta) {
            try {
              parts.push(`(${typeof l.meta === "string" ? l.meta : JSON.stringify(l.meta)})`);
            } catch {}
          }
          return { time, type: uiType, text: parts.join(" "), sortTs: ts };
        });

        // sort newest first
        mapped.sort((a, b) => b.sortTs - a.sortTs);

        if (!mounted) return;
        setItems(mapped);
      } catch (e: any) {
        if (!mounted) return;
        setError("Dnevnik proizvodnje trenutno nije dostupan.");
        console.error("ProductionLog load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadLogs();
    intervalId = window.setInterval(loadLogs, POLL_MS);

    return () => {
      mounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.text.toLowerCase().includes(q) || i.time.toLowerCase().includes(q));
  }, [search, items]);

  return (
    <div className="window" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div className="titlebar" style={{ background: "rgba(148,163,184,0.30)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
        <span className="titlebar-title">Dnevnik proizvodnje</span>
      </div>

      <div className="window-content" style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraga dnevnika..." style={{ height: 34, fontSize: 12 }} />

        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <div style={{ padding: 10, opacity: 0.7, fontSize: 12 }}>Učitavanje dnevnika…</div>}
          {error && <div style={{ padding: 10, fontSize: 12, color: "#ef4444" }}>{error}</div>}
          {!loading && !error && filtered.length === 0 && <div style={{ padding: 10, opacity: 0.7, fontSize: 12 }}>Dnevnik proizvodnje je prazan.</div>}

          {!loading && filtered.map((it, idx) => (
            <div key={idx} style={{ display: "flex", gap: 10, padding: "10px", borderRadius: 10, border: "1px solid var(--win11-divider)", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ width: 140, fontSize: 12, opacity: 0.75 }}>{it.time}</div>
              <div style={{ width: 22 }}>{it.type === "ok" ? "✅" : it.type === "warn" ? "⚠️" : "❌"}</div>
              <div style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{it.text}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, opacity: 0.8 }}>Ukupno zapisa: {items.length}</div>
      </div>
    </div>
  );
};

export default ProductionLog;
