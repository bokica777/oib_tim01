import React, { useEffect, useState } from "react";
import { processingAPI} from "../api/processing/ProcessingAPI";
import { ProcessRequestDTO } from "../models/processing/ProcessRequestDTO";
import { PerfumeDTO } from "../models/processing/PerfumeDTO";

import { ProcessForm } from "../components/processing/ProcessForm";
import { PerfumeList } from "../components/processing/PerfumeList"; 
import { PerfumeDetailModal } from "../components/processing/PerfumeDetailModal"; 

export const ProcessingPage: React.FC = () => {
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PerfumeDTO | null>(null);
  const [lastProduced, setLastProduced] = useState<PerfumeDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await processingAPI.listAvailable();
      setPerfumes(list);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Greška pri učitavanju dostupnih parfema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleProcess = async (dto: ProcessRequestDTO) => {
    try {
      setError(null);
      const produced = await processingAPI.process(dto);
      setLastProduced(produced);
      // refresh list
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Obrada nije uspela.");
    }
  };

  const handleReserve = async (name: string, count: number) => {
    try {
      setError(null);
      await processingAPI.requestForPackaging(name, count);
      await load();
      alert(`Uspešno rezervisano ${count} parfema: ${name}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Rezervacija nije uspela.");
    }
  };

  return (
    <div className="overlay-blur-none" style={{ padding: 12 }}>
      <div className="window" style={{ height: "100%", display: "grid", gridTemplateColumns: "360px 1fr 360px", gap: 12 }}>
        {/* Left - Process form */}
        <div style={{ padding: 12 }}>
          <div className="titlebar"><span className="titlebar-title">Obrada parfema</span></div>
          <div className="window-content" style={{ padding: 12 }}>
            <ProcessForm onProcess={handleProcess} />
            {lastProduced && lastProduced.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Poslednje proizvedeno:</strong>
                <ul>
                  {lastProduced.map(p => (<li key={p.id}>{p.name} — {p.netVolumeMl}ml — {p.serialNumber ?? ""}</li>))}
                </ul>
              </div>
            )}
            {error && <div style={{ marginTop: 12, color: "#ef4444" }}>{error}</div>}
          </div>
        </div>

        {/* Center - Perfume list */}
        <div style={{ padding: 12 }}>
          <div className="titlebar"><span className="titlebar-title">Dostupni parfemi</span></div>
          <div className="window-content" style={{ padding: 12 }}>
            <PerfumeList perfumes={perfumes} loading={loading} onSelect={setSelected} onReserve={handleReserve} />
          </div>
        </div>

        {/* Right - Details + logs */}
        <div style={{ padding: 12 }}>
          <div className="titlebar"><span className="titlebar-title">Detalji / Dnevnik</span></div>
          <div className="window-content" style={{ padding: 12 }}>
            {selected ? (
              <PerfumeDetailModal perfume={selected} onClose={() => setSelected(null)} />
            ) : (
              <div style={{ color: "rgba(255,255,255,0.7)" }}>Klikni na parfem za detalje. Trenutni logovi i obaveštenja će se ovde prikazivati.</div>
            )}
            {/* Simple log placeholder */}
            <div style={{ marginTop: 16, fontSize: 13 }}>
              <strong>System log</strong>
              <div style={{ marginTop: 8, maxHeight: 300, overflow: "auto", border: "1px solid rgba(255,255,255,0.04)", padding: 8 }}>
                {/* Could be wired to audit or processing logs later */}
                <div style={{ opacity: 0.7 }}>Nema upozorenja.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProcessingPage;
