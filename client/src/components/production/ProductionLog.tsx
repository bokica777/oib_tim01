import React, { useEffect, useMemo, useState, useRef } from "react";
import productionAPI from "../../api/production/ProductionAPI";
import { processingAPI } from "../../api/processing/ProcessingAPI";

type RawLog = {
  id?: number | string;
  type?: string;
  message?: string;
  source?: string;
  meta?: any;
  createdAt?: string;
  timestamp?: string;
  action?: string;
};

type LogItem = {
  id: string;
  ts: number;
  time: string;
  severity: "info" | "warn" | "error" | "action";
  source: string;
  title: string;
  message: string;
  meta?: any;
  action?: string;
};

const POLL_MS = 10000;

const iconForSource = (s: string) => {
  const src = (s ?? "").toLowerCase();
  if (src.includes("production")) return "🌱";
  if (src.includes("processing")) return "⚙️";
  if (src.includes("storage")) return "📦";
  if (src.includes("sales")) return "💸";
  return "🔔";
};

const severityFrom = (t?: string) => {
  const s = (t ?? "INFO").toString().toUpperCase();
  if (s === "ERROR") return "error";
  if (s === "WARNING") return "warn";
  if (s === "ACTION") return "action";
  return "info";
};

const colorForSeverity = (sev: LogItem["severity"]) =>
  sev === "error"
    ? "#ef4444"
    : sev === "warn"
    ? "#f59e0b"
    : sev === "action"
    ? "#60a5fa"
    : "#10b981";

const niceTime = (ts: number) => new Date(ts).toLocaleString();

export const ProductionLog: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "production" | "processing">("all");

  const lastTsRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let interval: number | undefined;

    const isTabVisible = () => typeof document !== "undefined" ? document.visibilityState === "visible" : true;

    const fetchDeltas = async () => {
      if (!isTabVisible()) return;

      try {
        setError(null);
        setLoading(true);

        const [prodRaw, procRaw] = await Promise.all([
          productionAPI.getLogs().catch(() => []),
          processingAPI.getLogs().catch(() => []),
        ]);

        const combined = ([...(prodRaw ?? []), ...(procRaw ?? [])] as RawLog[]).filter(Boolean);
        if (combined.length === 0) return;

        const mapped: LogItem[] = combined.map((r) => {
          const tsRaw = (r.createdAt ?? r.timestamp) as string | undefined;
          const ts = Date.parse(tsRaw ?? "") || Date.now();
          const severity = severityFrom(r.type);
          const action = r.action ?? r.meta?.action ?? r.meta?.event;
          const title = action
            ? String(action).replace(/_/g, " ")
            : (r.message ?? "").split("\n")[0] ?? r.source ?? "Event";
          const message = (r.message ?? JSON.stringify(r.meta ?? r, null, 2)) as string;
          const id = String(r.id ?? `${ts}-${Math.random().toString(36).slice(2, 8)}`);

          return {
            id,
            ts,
            time: niceTime(ts),
            severity,
            source: String(r.source ?? "unknown"),
            title,
            message,
            meta: r.meta,
            action: action ? String(action) : undefined,
          };
        });

        mapped.sort((a, b) => b.ts - a.ts);

        const newestTs = mapped[0]?.ts;
        if (newestTs && (!lastTsRef.current || newestTs > lastTsRef.current)) {
          lastTsRef.current = newestTs;
        }

        if (!mountedRef.current) return;
        setLogs((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newOnes = mapped.filter((m) => !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return [...newOnes, ...prev].slice(0, 500);
        });
      } catch (err: any) {
        if (!mountedRef.current) return;
        setError("Dnevnik proizvodnje trenutno nije dostupan.");
        console.error("ProductionLog load error:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchDeltas();
    interval = window.setInterval(fetchDeltas, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchDeltas();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      if (interval) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (filter === "production" && !l.source.toLowerCase().includes("production")) return false;
      if (filter === "processing" && !l.source.toLowerCase().includes("processing")) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        l.time.toLowerCase().includes(q)
      );
    });
  }, [logs, filter, query]);

  return (
    <div className="log-window" style={{ display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
      <div
        className="titlebar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "transparent",
        }}
      >
        <strong style={{ fontSize: 14 }}>Dnevnik proizvodnje</strong>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{ padding: "6px 8px", borderRadius: 6, fontSize: 13 }}
            aria-label="Filter dnevnika"
          >
            <option value="all">Svi</option>
            <option value="production">Samo proizvodnja</option>
            <option value="processing">Samo prerada</option>
          </select>

          <input
            placeholder="Pretraga..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, minWidth: 140, fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "auto" }}>
        {loading && <div style={{ opacity: 0.8, fontSize: 13 }}>Učitavanje zapisa...</div>}
        {error && <div style={{ color: "#ef4444", fontSize: 13 }}>{error}</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ opacity: 0.6, fontSize: 13 }}>Nema zapisa koji odgovaraju filteru.</div>
        )}

        {filtered.map((it) => (
          <div
            key={it.id}
            style={{
              display: "flex",
              gap: 12,
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.03)",
              background: "rgba(255,255,255,0.01)",
              alignItems: "flex-start",
            }}
            title={it.message}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44 }}>
              <div
                style={{
                  width: 8,
                  height: 44,
                  borderRadius: 6,
                  background: colorForSeverity(it.severity),
                  alignSelf: "center",
                }}
              />
              <div style={{ marginTop: 8, fontSize: 18 }}>{iconForSource(it.source)}</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.title}
                </div>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{it.time}</div>
                </div>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.03)",
                    color: "#cbd5e1",
                  }}
                >
                  {it.source}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--win11-text-primary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                    minWidth: 0,
                  }}
                >
                  {it.message}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          fontSize: 12,
          color: "var(--win11-text-tertiary)",
        }}
      >
        Ukupno zapisa: {logs.length} • Prikazano: {filtered.length}
      </div>
    </div>
  );
};

export default ProductionLog;
