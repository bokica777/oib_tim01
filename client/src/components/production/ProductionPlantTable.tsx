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

  const [selectedRow, setSelectedRow] = useState<PlantRow | null>(null);
  const [harvestCount, setHarvestCount] = useState(1);
  const [strengthPercent, setStrengthPercent] = useState(0);

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

      const plants = [
        { commonName: "Lavanda", latinName: "Lavandula angustifolia", countryOfOrigin: "Francuska" },
        { commonName: "Ruža", latinName: "Rosa damascena", countryOfOrigin: "Bugarska" },
        { commonName: "Jasmin", latinName: "Jasminum grandiflorum", countryOfOrigin: "Indija" },
        { commonName: "Bergamot", latinName: "Citrus bergamia", countryOfOrigin: "Italija" },
        { commonName: "Ylang-Ylang", latinName: "Cananga odorata", countryOfOrigin: "Indonezija" },
        { commonName: "Sandalovina", latinName: "Santalum album", countryOfOrigin: "Australija" },
      ];

      for (const plant of plants) {
        await plantAPI.plantNew(plant, token);
      }

      await loadPlants();
    } catch (err) {
      console.error("Greška pri sađenju biljaka", err);
    } finally {
      setActionLoading(false);
    }
  };

  const harvest = async () => {
    if (!selectedRow) {
      alert("Odaberi biljku za berbu.");
      return;
    }

    if (harvestCount <= 0 || harvestCount > selectedRow.kolicina) {
      alert("Neispravna količina za berbu.");
      return;
    }

    try {
      setActionLoading(true);

      await plantAPI.harvest(
        selectedRow.naziv,
        harvestCount,
        token
      );

      setSelectedRow(null);
      setHarvestCount(1);
      await loadPlants();
    } catch (err) {
      console.error("Greška pri berbi biljke", err);
    } finally {
      setActionLoading(false);
    }
  };

 const adjustStrength = async () => {
  if (!selectedRow) {
    alert("Odaberi biljku.");
    return;
  }

  if (!Number.isFinite(strengthPercent) || strengthPercent === 0) {
    alert("Unesi validan procenat.");
    return;
  }

  try {
    setActionLoading(true);

    await plantAPI.adjustStrength(
      selectedRow.id,
      strengthPercent,
      token
    );

    setStrengthPercent(0);
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
        {/* ACTION BUTTONS */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-accent" onClick={plantNew} disabled={actionLoading}>
            + Zasadi biljku
          </button>

          {/* UBERI */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="btn" onClick={harvest} disabled={actionLoading || !selectedRow}>
              Uberi biljku
            </button>
            <input
              type="number"
              min={1}
              max={selectedRow?.kolicina ?? 1}
              value={harvestCount}
              onChange={e => setHarvestCount(Number(e.target.value))}
              style={{ width: 70 }}
              disabled={!selectedRow}
            />
          </div>

          {/* PROMIJENI JAČINU */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="btn" onClick={adjustStrength} disabled={actionLoading || !selectedRow}>
              Promijeni jačinu
            </button>
            <input
              type="number"
              value={strengthPercent}
              onChange={e => setStrengthPercent(Number(e.target.value))}
              style={{ width: 70 }}
              disabled={!selectedRow}
            />
            <span>%</span>
          </div>
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
                <tr
                  key={i}
                  onClick={() => setSelectedRow(r)}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedRow?.naziv === r.naziv &&
                      selectedRow?.stanje === r.stanje
                        ? "rgba(34,197,94,0.15)"
                        : undefined,
                  }}
                >
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
          </tbody>
        </table>
      </div>
    </div>
  );
};
