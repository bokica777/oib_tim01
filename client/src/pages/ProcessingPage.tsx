import React, { useEffect, useRef, useState } from "react";
import { processingAPI } from "../api/processing/ProcessingAPI";
import { PerfumeDTO } from "../models/processing/PerfumeDTO";
import ProcessForm from "../components/processing/ProcessForm";
import PerfumeTable from "../components/processing/PerfumeTable";
import { ProcessRequestDTO } from "../models/processing/ProcessRequestDTO";
import { PerfumeStatus } from "../enums/processing/PerfumeStatus";
import { Message } from "../types/Message";

const MessageBanner: React.FC<{ msg: Message; onClose: () => void }> = ({ msg, onClose }) => {
  const bg = msg.type === "success" ? "#ecfccb" : msg.type === "error" ? "#fee2e2" : "#eff6ff";
  const color = msg.type === "success" ? "#365314" : msg.type === "error" ? "#991b1b" : "#1e3a8a";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        background: bg,
        color,
        marginBottom: 12,
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 14 }}>{msg.text}</div>
      <button
        onClick={onClose}
        style={{ marginLeft: 12, background: "transparent", border: "none", cursor: "pointer", color }}
        aria-label="Zatvori obaveštenje"
      >
        ✕
      </button>
    </div>
  );
};

export const ProcessingPage: React.FC = () => {
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeDTO | null>(null);

  const [message, setMessage] = useState<Message | null>(null);
  const messageTimerRef = useRef<number | null>(null);

  const loadPerfumes = async () => {
    setLoading(true);
    try {
      const data = await processingAPI.listPerfumes();
      setPerfumes(data);
    } catch (e) {
      console.error("loadPerfumes error", e);
      showMessage({ type: "error", text: "Greška pri učitavanju parfema." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerfumes();
  }, []);

  useEffect(() => {
    if (!message) return;
    if (messageTimerRef.current) {
      window.clearTimeout(messageTimerRef.current);
    }
    messageTimerRef.current = window.setTimeout(() => {
      setMessage(null);
      messageTimerRef.current = null;
    }, 3000);

    return () => {
      if (messageTimerRef.current) {
        window.clearTimeout(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    };
  }, [message]);

  const showMessage = (m: Message) => {
    setMessage(m);
  };

  const handleProcess = async (dto: ProcessRequestDTO) => {
    try {
      setProcessing(true);
      const produced = await processingAPI.processPerfume(dto);
      const producedCount = produced.length;
      if (producedCount === 0) {
        showMessage({ type: "info", text: "Prerada nije vratila nijednu bocu." });
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

      showMessage({ type: "success", text: `Prerada uspešna — kreirano ${producedCount} boca.` });
    } catch (e: any) {
      console.error(e);
      showMessage({
        type: "error",
        text: "Prerada nije uspela: " + (e?.response?.data?.message ?? e?.message ?? ""),
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Učitavanje parfema…</div>;

  return (
    <div
      style={{
        padding: 24,
        height: "calc(100vh - 60px)",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "stretch",
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>

        {message && <MessageBanner msg={message} onClose={() => setMessage(null)} />}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 3fr 220px",
            gap: 20,
            height: "100%",
            alignItems: "stretch",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                height: 56,
                padding: "12px 16px",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 700,
                background: "linear-gradient(90deg,#4f46e5,#06b6d4)",
                display: "flex",
                alignItems: "center",
              }}
            >
              Prerada parfema
            </div>
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                marginTop: 12,
                overflow: "auto",
                flex: "1 1 0",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.01)",
              }}
            >
              <ProcessForm perfumes={perfumes} onProcess={handleProcess} processing={processing} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                height: 56,
                padding: "12px 16px",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 700,
                background: "linear-gradient(90deg,#10b981,#059669)",
                display: "flex",
                alignItems: "center",
              }}
            >
              Lista prerađenih parfema
            </div>
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                marginTop: 12,
                overflow: "auto",
                flex: "1 1 0",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.01)",
              }}
            >
              <PerfumeTable perfumes={perfumes} onDetails={setSelectedPerfume} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                height: 56,
                padding: "12px 16px",
                borderRadius: 10,
                color: "#fff",
                fontWeight: 700,
                background: "linear-gradient(90deg,#ef4444,#dc2626)",
                display: "flex",
                alignItems: "center",
              }}
            >
              Detalji parfema
            </div>
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                marginTop: 12,
                overflow: "auto",
                flex: "1 1 0",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.01)",
              }}
            >
              {selectedPerfume ? (
                <div style={{ marginBottom: 12, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                  <h4 style={{ marginTop: 0, marginBottom: 8 }}>Detalji parfema:</h4>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Naziv:</strong> {selectedPerfume.name}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Količina:</strong> {selectedPerfume.count}
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Zapremina:</strong> {selectedPerfume.volume} ml
                  </div>
                  <div style={{ marginBottom: 0 }}>
                    <strong>Status:</strong> {selectedPerfume.status}
                  </div>
                </div>
              ) : (
                <div>Izaberi parfem sa leve strane za detalje.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingPage;
