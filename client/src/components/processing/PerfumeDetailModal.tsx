import React, { useEffect, useState } from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO"; 
import { processingAPI} from "../../api/processing/ProcessingAPI";

type Props = {
  perfume: PerfumeDTO;
  onClose: () => void;
};

export const PerfumeDetailModal: React.FC<Props> = ({ perfume, onClose }) => {
  const [details, setDetails] = useState<PerfumeDTO | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!perfume.id) {
        setDetails(perfume);
        return;
      }
      try {
        setLoading(true);
        const d = await processingAPI.getById(perfume.id);
        setDetails(d);
      } catch (err) {
        console.error(err);
        // fallback: show provided brief perfume info
        setDetails(perfume);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [perfume]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Učitavanje...</div>
        <div style={{ opacity: 0.7 }}>Prikupljam detalje parfema...</div>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{details.name}</strong>
        <div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div><strong>Tip:</strong> {details.type}</div>
        <div><strong>Zapremina:</strong> {details.netVolumeMl} ml</div>
        <div><strong>Status:</strong> {details.status}</div>
        <div><strong>Serial:</strong> {details.serialNumber ?? "-"}</div>
        <div style={{ marginTop: 8 }}>
          <strong>Source plants:</strong>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {details.sourcePlantIds?.length ? details.sourcePlantIds.join(", ") : "Nema podataka"}
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Rok trajanja:</strong> {details.expirationDate ? new Date(details.expirationDate).toLocaleDateString() : "n/a"}
        </div>
      </div>
    </div>
  );
};
