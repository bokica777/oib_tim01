import React, { useEffect, useMemo, useState } from "react";
import { ProductionPlantTable } from "../components/production/ProductionPlantTable";
import { ProductionLog } from "../components/production/ProductionLog";
import ProcessingPage from "./ProcessingPage";
import StoragePage from "./StoragePage";
import PackagingPage from "./PackagingPage";
import SalesPage from "./SalesPage";
import PerformancePage from "./PerformancePage";
import AnalysisSalesPage from "./AnalysisSalesPage";
import AdminUsersPage from "./AdminUsersPage";

function getUserRoleFromToken(): string | null {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || payload.userRole || payload.authorities?.[0] || null;
  } catch {
    return null;
  }
}

function formatRole(role: string | null): string {
  if (!role) return "Nepoznata uloga";
  const normalized = role.replace("ROLE_", "").toLowerCase();

  switch (normalized) {
    case "admin":
      return "Administrator";
    case "sales_manager":
      return "Menadžer proizvodnje";
    case "seller":
      return "Prodavač";
    default:
      return "Nepoznata uloga";
  }
}

// (Privremeno) placeholder dok ne napraviš audit ekran
const AuditLogsPlaceholder: React.FC = () => {
  return (
    <div
      style={{
        border: "1px solid var(--win11-divider)",
        background: "rgba(0,0,0,0.15)",
        borderRadius: 10,
        padding: 14,
      }}
    >
      <h2 style={{ marginBottom: 8 }}>Audit logovi</h2>
      <p style={{ marginBottom: 0 }}>
        Ovdje ide ekran za audit logove. Ako imaš već komponentu/stranicu za audit, pošalji mi pa je ubacim.
      </p>
    </div>
  );
};

type TopTab =
  | "proizvodnja"
  | "prerada"
  | "pakovanje"
  | "skladistenje"
  | "prodaja"
  | "analiza_performansi"
  | "analiza_prodaje"
  | "audit"
  | "korisnici";

export const ProductionPage: React.FC = () => {
  const tokenRole = getUserRoleFromToken();
  const rawRole = (tokenRole ?? "").replace("ROLE_", "").toLowerCase();
  const isAdmin = rawRole === "admin";

  const initialTopTab: TopTab = isAdmin ? "analiza_performansi" : "proizvodnja";

  const [activeTopTab, setActiveTopTab] = useState<TopTab>(initialTopTab);

  const [activeSubTab, setActiveSubTab] = useState<"servisProizvodnje" | "servisPrerade">(
    "servisProizvodnje"
  );

  const roleLabel = useMemo(() => formatRole(tokenRole), [tokenRole]);

  useEffect(() => {
    setActiveTopTab(isAdmin ? "analiza_performansi" : "proizvodnja");
  }, [isAdmin]);

  const showSubtabs = !isAdmin && (activeTopTab === "proizvodnja" || activeTopTab === "prerada");

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

      <div className="window" style={{ height: "100%", position: "relative" }}>
        <div className="titlebar">
          <span className="titlebar-title">
            {isAdmin
              ? "Parfimerija O'Sinel De Or - Administracija"
              : "Parfimerija O'Sinel De Or - Proizvodnja i prerada"}
          </span>
        </div>

        <div className="window-content" style={{ padding: 10, height: "calc(100vh - 160px)", overflowY: "auto" }}>
          {/* TOP TABS */}
          <div className="prod-menubar" style={{ display: "flex", gap: 6, padding: "6px 10px" }}>
            {!isAdmin && (
              <>
                <button className={activeTopTab === "proizvodnja" ? "active" : ""} onClick={() => setActiveTopTab("proizvodnja")}>
                  Proizvodnja
                </button>
                <button className={activeTopTab === "prerada" ? "active" : ""} onClick={() => setActiveTopTab("prerada")}>
                  Prerada
                </button>
                <button className={activeTopTab === "pakovanje" ? "active" : ""} onClick={() => setActiveTopTab("pakovanje")}>
                  Pakovanje
                </button>
                <button className={activeTopTab === "skladistenje" ? "active" : ""} onClick={() => setActiveTopTab("skladistenje")}>
                  Skladištenje
                </button>
                <button className={activeTopTab === "prodaja" ? "active" : ""} onClick={() => setActiveTopTab("prodaja")}>
                  Prodaja
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  className={activeTopTab === "analiza_performansi" ? "active" : ""}
                  onClick={() => setActiveTopTab("analiza_performansi")}
                >
                  Analiza performansi
                </button>

                <button
                  className={activeTopTab === "analiza_prodaje" ? "active" : ""}
                  onClick={() => setActiveTopTab("analiza_prodaje")}
                >
                  Analiza prodaje
                </button>

                <button className={activeTopTab === "audit" ? "active" : ""} onClick={() => setActiveTopTab("audit")}>
                  Audit logovi
                </button>

                <button
                  className={activeTopTab === "korisnici" ? "active" : ""}
                  onClick={() => setActiveTopTab("korisnici")}
                >
                  Korisnici
                </button>
              </>
            )}
          </div>

          {/* SUBTABS samo za proizvodnju/preradu i samo kad nije admin */}
          {showSubtabs && (
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
          )}

          {/* CONTENT */}
          <div style={{ padding: 10 }}>
            {!isAdmin && activeTopTab === "proizvodnja" && (
              <div className="prod-grid">
                <ProductionPlantTable />
                <ProductionLog />
              </div>
            )}

            {!isAdmin && activeTopTab === "prerada" && <ProcessingPage />}
            {!isAdmin && activeTopTab === "pakovanje" && <PackagingPage />}
            {!isAdmin && activeTopTab === "skladistenje" && <StoragePage />}
            {!isAdmin && activeTopTab === "prodaja" && <SalesPage />}

            {isAdmin && activeTopTab === "analiza_performansi" && <PerformancePage />}
            {isAdmin && activeTopTab === "analiza_prodaje" && <AnalysisSalesPage />}
            {isAdmin && activeTopTab === "audit" && <AuditLogsPlaceholder />}

            {/* Ovo sad više NE SMIJE da prekriva ekran */}
            {isAdmin && activeTopTab === "korisnici" && <AdminUsersPage />}
          </div>
        </div>

        <div className="prod-statusbar">
          <div className="prod-muted">
            Korisnik: <strong>{roleLabel}</strong> &nbsp; | &nbsp; Status: <strong>Povezan</strong>
          </div>
          <div className="prod-muted">{new Date().toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
