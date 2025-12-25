import React, { useState } from "react";
import { ProductionPlantTable } from "../components/production/ProductionPlantTable";
import { ProductionLog } from "../components/production/ProductionLog";

export const ProductionPage: React.FC = () => {
  const [activeTopTab, setActiveTopTab] = useState<
    "proizvodnja" | "prerada" | "pakovanje" | "skladistenje" | "prodaja"
  >("proizvodnja");

  const [activeSubTab, setActiveSubTab] = useState<"servisProizvodnje" | "servisPrerade">(
    "servisProizvodnje"
  );

  return (
    <div
      className="overlay-blur-none"
      style={{
        position: "fixed",
        inset: 0,
        padding: "10px",
        backgroundColor: "var(--win11-bg)",
      }}
    >
      {/* Lokalni CSS da izgleda kao na slici */}
      <style>{`
        .prod-menubar button {
          background: transparent;
          border: none;
          padding: 8px 10px;
          font-size: 13px;
          cursor: pointer;
          color: var(--win11-text-primary);
          opacity: 0.85;
        }
        .prod-menubar button.active {
          font-weight: 700;
          opacity: 1;
          border-bottom: 2px solid var(--win11-accent);
        }

        .prod-subtabs {
          display: flex;
          gap: 8px;
          padding: 8px 10px;
          border-bottom: 1px solid var(--win11-divider);
        }
        .prod-subtabs button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--win11-divider);
          background: rgba(255,255,255,0.03);
          color: var(--win11-text-primary);
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        .prod-subtabs button.active {
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06) inset;
        }

        .prod-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
          height: calc(100% - 118px);
        }

        .prod-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .prod-table thead th {
          text-align: left;
          font-weight: 700;
          padding: 8px 10px;
          border-bottom: 1px solid var(--win11-divider);
          background: rgba(255,255,255,0.03);
        }
        .prod-table tbody td {
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .prod-table tbody tr:hover {
          background: rgba(255,255,255,0.04);
        }

        .prod-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          font-size: 11px;
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.08);
          color: #111;
        }
        .prod-badge.planted { background: #d1fae5; }
        .prod-badge.harvested { background: #ffedd5; }
        .prod-badge.processed { background: #dbeafe; }

        .prod-statusbar {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 10px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          border: 1px solid var(--win11-divider);
          background: rgba(0,0,0,0.15);
          border-radius: 10px;
          font-size: 12px;
          color: var(--win11-text-primary);
        }

        .prod-muted { opacity: 0.75; }
      `}</style>

      {/* Glavni prozor */}
      <div className="window" style={{ height: "100%", position: "relative" }}>
        <div className="titlebar">
          <span className="titlebar-title">Parfimerija O&apos;Sinel De Or - Proizvodnja i prerada</span>
        </div>

        {/* Gornji meni (kao na slici) */}
        <div className="window-content" style={{ padding: 0 }}>
          <div className="prod-menubar" style={{ display: "flex", gap: 6, padding: "6px 10px" }}>
            <button
              className={activeTopTab === "proizvodnja" ? "active" : ""}
              onClick={() => setActiveTopTab("proizvodnja")}
            >
              Proizvodnja
            </button>
            <button
              className={activeTopTab === "prerada" ? "active" : ""}
              onClick={() => setActiveTopTab("prerada")}
            >
              Prerada
            </button>
            <button
              className={activeTopTab === "pakovanje" ? "active" : ""}
              onClick={() => setActiveTopTab("pakovanje")}
            >
              Pakovanje
            </button>
            <button
              className={activeTopTab === "skladistenje" ? "active" : ""}
              onClick={() => setActiveTopTab("skladistenje")}
            >
              Skladištenje
            </button>
            <button
              className={activeTopTab === "prodaja" ? "active" : ""}
              onClick={() => setActiveTopTab("prodaja")}
            >
              Prodaja
            </button>
          </div>

          {/* “Servis proizvodnje / servis prerade” (kao drugi red tabova) */}
          <div className="prod-subtabs">
            <button
              className={activeSubTab === "servisProizvodnje" ? "active" : ""}
              onClick={() => setActiveSubTab("servisProizvodnje")}
              title="Servis proizvodnje"
            >
              <span>🧪</span> Servis proizvodnje
            </button>
            <button
              className={activeSubTab === "servisPrerade" ? "active" : ""}
              onClick={() => setActiveSubTab("servisPrerade")}
              title="Servis prerade"
            >
              <span>💧</span> Servis prerade
            </button>
          </div>

          {/* GLAVNI LAYOUT: lijevo tabela + desno dnevnik */}
          <div className="window-content" style={{ padding: 10 }}>
            <div className="prod-grid">
              <ProductionPlantTable />
              <ProductionLog />
            </div>
          </div>
        </div>

        {/* Donji status bar (kao na slici) */}
        <div className="prod-statusbar">
          <div className="prod-muted">
            Korisnik: <strong>Menadžer proizvodnje</strong> &nbsp; | &nbsp; Status: <strong>Povezan</strong>
          </div>
          <div className="prod-muted">22.10.2025 15:12</div>
        </div>
      </div>
    </div>
  );
};
