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

const CATALOG = [
  { commonName: "Lavanda", latinName: "Lavandula angustifolia", countryOfOrigin: "Francuska" },
  { commonName: "Ruža", latinName: "Rosa damascena", countryOfOrigin: "Bugarska" },
  { commonName: "Jasmin", latinName: "Jasminum grandiflorum", countryOfOrigin: "Indija" },
  { commonName: "Bergamot", latinName: "Citrus bergamia", countryOfOrigin: "Italija" },
  { commonName: "Ylang-Ylang", latinName: "Cananga odorata", countryOfOrigin: "Indonezija" },
  { commonName: "Sandalovina", latinName: "Santalum album", countryOfOrigin: "Australija" },
] as const;


export const ProductionPlantTable: React.FC = () => {
  const [rows, setRows] = useState<PlantRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedRow, setSelectedRow] = useState<PlantRow | null>(null);
  const [harvestCount, setHarvestCount] = useState(1);
  const [strengthPercent, setStrengthPercent] = useState(0);

  const token = localStorage.getItem("accessToken") ?? "";

 const loadPlants = async () => {
  try {
    setLoading(true);

    const data: Plant[] = await plantAPI.getPlants(token, 10000);

    const plantedCount = new Map<string, number>();
    const plantedStrengthSum = new Map<string, number>();
    const plantedStrengthCnt = new Map<string, number>();

    for (const p of data) {
      if (p.status !== "PLANTED") continue; 
      plantedCount.set(p.commonName, (plantedCount.get(p.commonName) ?? 0) + 1);
      plantedStrengthSum.set(p.commonName, (plantedStrengthSum.get(p.commonName) ?? 0) + (p.aromaticOilStrength ?? 0));
      plantedStrengthCnt.set(p.commonName, (plantedStrengthCnt.get(p.commonName) ?? 0) + 1);
    }

    const next: PlantRow[] = CATALOG.map((c) => {
      const kolicina = plantedCount.get(c.commonName) ?? 0;
      const cnt = plantedStrengthCnt.get(c.commonName) ?? 0;
      const avgStrength = cnt ? plantedStrengthSum.get(c.commonName)! / cnt : 0;

      return {
        id: 0, 
        naziv: c.commonName,
        latinski: c.latinName,
        jacina: Number(avgStrength.toFixed(2)),
        kolicina,
        stanje: "PLANTED",
      };
    });

    setRows(next);
  } catch (err) {
    console.error("Greška pri učitavanju biljaka", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadPlants();
  }, []);

 const plantNew = async () => {
  if (!selectedRow) {
    alert("Odaberi biljku koju želiš da zasadiš.");
    return;
  }

  try {
    setActionLoading(true);

    const cat = CATALOG.find(c => c.commonName === selectedRow.naziv);
    if (!cat) {
      alert("Nepoznata biljka u katalogu.");
      return;
    }

    await plantAPI.plantNew(
      {
        commonName: cat.commonName,
        latinName: cat.latinName,
        countryOfOrigin: cat.countryOfOrigin,
      },
      token
    );

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

    if (selectedRow.stanje !== "PLANTED") {
      alert("Možeš brati samo posađene biljke.");
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

  if (selectedRow.kolicina <= 0) {
    alert("Nema posađenih biljaka ove vrste.");
    return;
  }

  if (!Number.isFinite(strengthPercent) || strengthPercent === 0) {
    alert("Unesi validan procenat.");
    return;
  }

  try {
    setActionLoading(true);

    await plantAPI.adjustStrength(0, strengthPercent, token, selectedRow.naziv);

    setStrengthPercent(0);
    await loadPlants();
  } catch (err) {
    console.error("Greška pri promjeni jačine", err);
  } finally {
    setActionLoading(false);
  }
};


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
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-accent" onClick={plantNew} disabled={actionLoading}>
            + Zasadi biljku
          </button>
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
