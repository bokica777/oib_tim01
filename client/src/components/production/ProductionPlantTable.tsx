import React, { useEffect, useMemo, useState } from "react";
import { PlantAPI } from "../../api/plants/PlantAPI";
import { Plant } from "../../types/Plant";

const plantAPI = new PlantAPI();

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

  const token = localStorage.getItem("authToken") ?? "";

  // =========================
  // LOAD PLANTS
  // =========================
  const loadPlants = async () => {
    try {
      setLoading(true);

      const data: Plant[] = await plantAPI.getPlants(token, 100);

      const map = new Map<string, PlantRow>();

      data.forEach(p => {
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

  // =========================
  // ACTIONS
  // =========================
  const plantNew = async () => {
    try {
      setActionLoading(true);

      await plantAPI.plantNew(
        {
          commonName: "Lavanda",
          latinName: "Lavandula angustifolia",
          countryOfOrigin: "Francuska",
        },
        token
      );

      await loadPlants();
    } catch (err) {
      console.error("Greška pri sađenju biljke", err);
    } finally {
      setActionLoading(false);
    }
  };

  const adjustStrength = async () => {
    if (rows.length === 0) return;

    try {
      setActionLoading(true);

      await plantAPI.plantAndScale(
        rows[0].jacina,
        1.1,
        token
      );

      await loadPlants();
    } catch (err) {
      console.error("Greška pri promjeni jačine", err);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // FILTER
  // =========================
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
    <div className="window">
      <div className="titlebar" style={{ background: "rgba(34,197,94,0.35)" }}>
        <span className="titlebar-title">Upravljanje biljkama</span>
      </div>

      <div className="window-content">
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-accent" onClick={plantNew} disabled={actionLoading}>
            + Zasadi biljku
          </button>

          <button className="btn" onClick={adjustStrength} disabled={actionLoading}>
            Promijeni jačinu
          </button>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pretraga biljaka..."
        />

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
                <td colSpan={5}>Učitavanje…</td>
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
                    <span className={badgeClass(r.stanje)}>{r.stanje}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
