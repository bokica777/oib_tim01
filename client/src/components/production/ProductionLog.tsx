import React, { useEffect, useMemo, useState } from "react";

type LogItem = {
  time: string;
  type: "ok" | "warn";
  text: string;
};

export const ProductionLog: React.FC = () => {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * BACKEND-READY:
   * kasnije ćeš ovdje samo dodati:
   *   const data = await productionAPI.getLogs();
   *   setItems(data);
   */
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🚧 backend još nije spojen
        // const data = await productionAPI.getLogs();
        // setItems(data);

        setItems([]); // prazno stanje je VALIDNO
      } catch (e) {
        setError("Dnevnik proizvodnje trenutno nije dostupan.");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      i => i.text.toLowerCase().includes(q) || i.time.includes(q)
    );
  }, [search, items]);

  return (
    <div className="window" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Titlebar */}
      <div
        className="titlebar"
        style={{
          background: "rgba(148,163,184,0.30)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <span className="titlebar-title">Dnevnik proizvodnje</span>
      </div>

      <div className="window-content" style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pretraga dnevnika..."
          style={{ height: 34, fontSize: 12 }}
        />

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && (
            <div style={{ padding: 10, opacity: 0.7, fontSize: 12 }}>
              Učitavanje dnevnika…
            </div>
          )}

          {error && (
            <div style={{ padding: 10, fontSize: 12, color: "#ef4444" }}>
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 10, opacity: 0.7, fontSize: 12 }}>
              Dnevnik proizvodnje je prazan.
            </div>
          )}

          {!loading &&
            filtered.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid var(--win11-divider)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ width: 48, fontSize: 12, opacity: 0.75 }}>
                  {it.time}
                </div>
                <div style={{ width: 18 }}>
                  {it.type === "ok" ? "✅" : "⚠️"}
                </div>
                <div style={{ fontSize: 12 }}>{it.text}</div>
              </div>
            ))}
        </div>

        {/* Footer */}
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Ukupno zapisa: {items.length}
        </div>
      </div>
    </div>
  );
};
