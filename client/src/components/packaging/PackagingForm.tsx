import React, { useEffect, useMemo, useState } from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { WarehouseDTO } from "../../models/storage/WarehouseDTO";

type Props = {
  perfumes: PerfumeDTO[];
  warehouses: WarehouseDTO[];
  processing?: boolean;
  onPack: (perfumeName: string, bottles: number, volumePerBottle: 150 | 250, warehouseId: number) => Promise<void>;
};

const PackagingForm: React.FC<Props> = ({ perfumes, warehouses, processing, onPack }) => {
  const names = useMemo(
    () => Array.from(new Set((perfumes || []).map(p => p.name))).filter(Boolean),
    [perfumes]
  );

  const [perfumeName, setPerfumeName] = useState<string>(names[0] ?? "");
  const [bottles, setBottles] = useState<number>(1);
  const [volumePerBottle, setVolumePerBottle] = useState<150 | 250>(150);
  const [warehouseId, setWarehouseId] = useState<number | null>(
    warehouses[0]?.id ? Number(warehouses[0].id) : null
  );

  useEffect(() => {
    if (!perfumeName && names[0]) setPerfumeName(names[0]);
  }, [names]);

  useEffect(() => {
    if ((warehouseId === null || warehouseId === undefined) && warehouses[0]) {
      setWarehouseId(Number(warehouses[0].id));
    }
  }, [warehouses]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfumeName) return alert("Izaberi ime parfema.");
    if (!Number.isInteger(bottles) || bottles <= 0) return alert("Neispravan broj boca.");
    if (!warehouseId) return alert("Izaberi skladište.");
    await onPack(perfumeName, bottles, volumePerBottle, Number(warehouseId));
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* PARFEM */}
      <div>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
          Parfem
        </label>
        <select
          value={perfumeName}
          onChange={e => setPerfumeName(e.target.value)}
          style={{ width: "100%" }}
        >
          {names.length === 0 && <option value="">-- nema parfema --</option>}
          {names.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 1.4fr",
          gap: 12,
          alignItems: "end",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Broj boca
          </label>
          <input
            type="number"
            min={1}
            value={bottles}
            onChange={e => setBottles(Number(e.target.value) || 1)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Zapremina
          </label>
          <select
            value={String(volumePerBottle)}
            onChange={e => setVolumePerBottle(Number(e.target.value) as 150 | 250)}
            style={{ width: "100%" }}
          >
            <option value="150">150 ml</option>
            <option value="250">250 ml</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Skladište
          </label>
          <select
            value={warehouseId ?? ""}
            onChange={e => setWarehouseId(Number(e.target.value))}
            style={{ width: "100%" }}
          >
            {warehouses.length === 0 && <option value="">-- nema skladišta --</option>}
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}{w.location ? ` — ${w.location}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {}
      <div style={{ marginTop: 8 }}>
        <button
          className="btn btn-accent"
          type="submit"
          disabled={processing}
          style={{ width: "100%" }}
        >
          {processing ? "Pakuje..." : "Započni preradu i pakuje"}
        </button>
      </div>
    </form>
  );
};

export default PackagingForm;
