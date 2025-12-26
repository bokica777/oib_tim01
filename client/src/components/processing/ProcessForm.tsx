import React, { useState } from "react";
import { ProcessRequestDTO } from "../../models/processing/ProcessRequestDTO";
import { PerfumeType } from "../../enums/processing/PerfumeType";

type Props = {
  onProcess: (dto: ProcessRequestDTO) => Promise<void>;
};

export const ProcessForm: React.FC<Props> = ({ onProcess }) => {
  const [perfumeName, setPerfumeName] = useState("");
  const [type, setType] = useState<PerfumeType>(PerfumeType.PERFUME);
  const [bottles, setBottles] = useState<number>(1);
  const [volume, setVolume] = useState<number>(150);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!perfumeName.trim()) { setLocalError("Ime parfema je obavezno."); return; }
    if (![150, 250].includes(volume)) { setLocalError("Zapremina boce mora biti 150 ili 250 ml."); return; }
    if (!Number.isInteger(bottles) || bottles < 1) { setLocalError("Broj boca mora biti ceo broj >= 1."); return; }

    setLoading(true);
    try {
      await onProcess({ perfumeName: perfumeName.trim(), type, bottles, volumePerBottle: volume });
      setPerfumeName("");
      setBottles(1);
      setVolume(150);
    } catch (err) {
      // onProcess handles errors; still show fallback
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label>Ime parfema</label>
      <input value={perfumeName} onChange={e => setPerfumeName(e.target.value)} placeholder="npr. Rose" required />

      <label>Tip</label>
      <select value={type} onChange={e => setType(e.target.value as PerfumeType)}>
        <option value="PERFUME">Perfume</option>
        <option value="COLOGNE">Cologne</option>
      </select>

      <label>Broj boca</label>
      <input type="number" value={bottles} onChange={e => setBottles(Number(e.target.value))} min={1} />

      <label>Zapremina (ml)</label>
      <select value={volume} onChange={e => setVolume(Number(e.target.value))}>
        <option value={150}>150</option>
        <option value={250}>250</option>
      </select>

      {localError && <div style={{ color: "#ef4444" }}>{localError}</div>}

      <button className="btn btn-accent" type="submit" disabled={loading}>
        {loading ? "Procesujem..." : "Pokreni preradu"}
      </button>
    </form>
  );
};
