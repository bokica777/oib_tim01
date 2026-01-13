import React, { useEffect, useState } from "react";
import { processingAPI } from "../api/processing/ProcessingAPI";
import { PerfumeDTO } from "../models/processing/PerfumeDTO";
import ProcessForm from "../components/processing/ProcessForm";
import PerfumeTable from "../components/processing/PerfumeTable"; 
import { ProcessRequestDTO } from "../models/processing/ProcessRequestDTO";
import { PerfumeStatus } from "../enums/processing/PerfumeStatus";

export const ProcessingPage: React.FC = () => {
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeDTO | null>(null);

  const loadPerfumes = async () => {
    setLoading(true);
    try {
      const data = await processingAPI.listPerfumes();
      setPerfumes(data);
    } catch (e) {
      console.error("loadPerfumes error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfumes();
  }, []);

  const handleProcess = async (dto: ProcessRequestDTO) => {
    try {
      setProcessing(true);
      const produced = await processingAPI.processPerfume(dto);
      const producedCount = produced.length;
      if (producedCount === 0) {
        alert("Prerada nije vratila nijednu bocu.");
        return;
      }
      setPerfumes((prev) => {
        const idx = prev.findIndex((p) => p.name === dto.perfumeName && p.volume === dto.volumePerBottle);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            count: (copy[idx].count ?? 0) + producedCount,
            status: PerfumeStatus.AVAILABLE,
            createdAt: new Date().toISOString(),
          };
          return copy;
        } else {
          const newItem: PerfumeDTO = {
            id: `${dto.perfumeName}-${dto.volumePerBottle}-${Date.now()}`,
            name: dto.perfumeName,
            volume: dto.volumePerBottle,
            count: producedCount,
            status: PerfumeStatus.AVAILABLE,
            createdAt: new Date().toISOString(),
          };
          return [newItem, ...prev];
        }
      });

      alert(`Prerada uspešna — kreirano ${producedCount} boca.`);
    } catch (e: any) {
      console.error(e);
      alert("Prerada nije uspela: " + (e?.response?.data?.message ?? e?.message ?? ""));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Učitavanje parfema…</div>;

  return (
    <div style={{ padding: 12, height: "calc(100vh - 60px)", boxSizing: "border-box" }}>
      {/* three-column grid: left (form), center (table), right (details) */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr 320px", gap: 12, height: "100%", minHeight: 0 }}>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#4f46e5,#06b6d4)" }}>
            Prerada parfema
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            <ProcessForm perfumes={perfumes} onProcess={handleProcess} processing={processing} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#10b981,#059669)" }}>
            Lista prerađenih parfema
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            <PerfumeTable perfumes={perfumes} onDetails={setSelectedPerfume} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ height: 48, padding: 12, borderRadius: 8, color: "#fff", fontWeight: 700, background: "linear-gradient(90deg,#ef4444,#dc2626)" }}>
            Detalji parfema
          </div>
          <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: 6, marginTop: 8, overflow: "auto", flex: "1 1 0" }}>
            {selectedPerfume ? (
              <div style={{ marginBottom: 12, padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                <h4>Detalji parfema:</h4>
                <div><strong>Naziv:</strong> {selectedPerfume.name}</div>
                <div><strong>Količina:</strong> {selectedPerfume.count}</div>
                <div><strong>Zapremina:</strong> {selectedPerfume.volume} ml</div>
                <div><strong>Status:</strong> {selectedPerfume.status}</div>
              </div>
            ) : (
              <div>Izaberi parfem sa leve strane za detalje.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProcessingPage;
