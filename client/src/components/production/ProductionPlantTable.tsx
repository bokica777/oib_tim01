import React, { useEffect, useMemo, useState } from "react";
import { ProductionAPI } from "../../api/production/ProductionAPI";

const productionAPI = new ProductionAPI();

/**
 * DTO koji UI koristi
 * (ne mora 1:1 odgovarati backendu)
 */
type PlantRow = {
  id: number;
  naziv: string;
  latinski: string;
  jacina: number;
  kolicina: number;
  stanje: "PLANTED" | "HARVESTED" | "PROCESSED";
};

export const ProductionPlantTable: React.FC = () => {
  const [rows, setRows] = useState<PlantRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * === LOAD PLANTS ===
   * OVDJE se kasnije samo uključi pravi backend
   */
  const loadPlants = async () => {
    try {
      setLoading(true);

      // 🔌 BACKEND HOOK (kasnije radi)
      const data = await productionAPI.getAvailablePlants(100);

      // Grupisanje pojedinačnih biljaka u redove
      const map = new Map<string, PlantRow>();

      data.forEach((p: any) => {
        const key = `${p.commonName}_${p.status}`;

        if (!map.has(key)) {
          map.set(key, {
            id: p.id,
            naziv: p.commonName,
            latinski: p.latinName,
            jacina: p.aromaticOilStrength,
            kolicina: 1,
            stanje: p.status,
          });
        } else {
          map.get(key)!.kolicina += 1;
        }
      });

      setRows(Array.from(map.values()));
    } catch (err) {
      console.error("Greška pri učitavanju biljaka", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, []);

  /**
   * === ACTIONS ===
   * OVE FUNKCIJE SU OBAVEZNE (kao što si pitala)
   * kasnije samo backend proradi
   */
  const plantNew = async () => {
    try {
      setActionLoading(true);

      await productionAPI.plantNew({
        commonName: "Lavanda",
        latinName: "Lavandula angustifolia",
        countryOfOrigin: "Francuska",
      });

      await loadPlants();
    } catch (err) {
      console.error("Greška pri sađenju biljke", err);
    } finally {
      setActionLoading(false);
    }
  };

  const harvest = async () => {
    try {
      setActionLoading(true);

      await productionAPI.harvest({
        commonName: "Lavanda",
        count: 1,
      });

      await loadPlants();
    } catch (err) {
      console.error("Greška pri berbi", err);
    } finally {
      setActionLoading(false);
    }
  };

  const adjustStrength = async () => {
    if (rows.length === 0) return;

    try {
      setActionLoading(true);

      await productionAPI.adjustStrength(rows[0].id, {
        value: 10,
        mode: "inc",
      });

      await loadPlants();
    } catch (err) {
      console.error("Greška pri promjeni jačine", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * === FILTER ===
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter(
      r =>
        r.naziv.toLowerCase().includes(q) ||
        r.latinski.toLowerCase().includes(q) ||
        r.stanje.toLowerCase().includes(q)
    );
  }, [search, rows]);

  const badgeClass = (s: PlantRow["stanje"]) => {
    if (s === "PLANTED") return "prod-badge planted";
    if (s === "HARVESTED") return "prod-badge harvested";
    return "prod-badge processed";
  };

  return (
    <div className="window" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div
        className="titlebar"
        style={{ background: "rgba(34,197,94,0.35)" }}
      >
        <span className="titlebar-title">Upravljanje biljkama</span>
      </div>

      <div className="window-content" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-accent"
            onClick={plantNew}
            disabled={actionLoading}
          >
            + Zasadi biljku
          </button>

          <button
            className="btn"
            onClick={harvest}
            disabled={actionLoading}
          >
            Uberi biljku
          </button>

          <button
            className="btn"
            onClick={adjustStrength}
            disabled={actionLoading}
          >
            Promijeni jačinu
          </button>
        </div>

        {/* SEARCH */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pretraga biljaka..."
          style={{ height: 34, fontSize: 12 }}
        />

        {/* TABLE */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <table className="prod-table">
            <thead>
              <tr>
                <th>Naziv</th>
                <th>Latinski</th>
                <th>Jačina</th>
                <th>Količina</th>
                <th>Stanje</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                    Učitavanje…
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r, i) => (
                  <tr key={i}>
                    <td>{r.naziv}</td>
                    <td><i>{r.latinski}</i></td>
                    <td>{r.jacina.toFixed(2)}</td>
                    <td>{r.kolicina}</td>
                    <td>
                      <span className={badgeClass(r.stanje)}>
                        {r.stanje}
                      </span>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                    Nema podataka
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Ukupno biljaka: {rows.reduce((s, r) => s + r.kolicina, 0)}
        </div>
      </div>
    </div>
  );
};
