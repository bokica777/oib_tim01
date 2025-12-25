import React, { useState } from "react";
import { IAuthAPI } from "../api/auth/IAuthAPI";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

type AuthPageProps = {
  authAPI: IAuthAPI;
};

export const AuthPage: React.FC<AuthPageProps> = ({ authAPI }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div
      className="overlay-blur-none"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "24px",
      }}
    >
      {/* ================= LEFT: AUTH WINDOW ================= */}
      <div className="window" style={{ width: "500px", maxWidth: "90%" }}>
        <div className="titlebar">
          <div className="titlebar-icon">
            <img src="/icon.png" width="20" height="20" />
          </div>
          <span className="titlebar-title">Authentication</span>
        </div>

        <div className="window-content" style={{ padding: 0 }}>
          {/* Tabs */}
          <div
            className="flex"
            style={{ borderBottom: "1px solid var(--win11-divider)" }}
          >
            <button
              className={`flex-1 ${
                activeTab === "login" ? "btn-accent" : "btn-ghost"
              }`}
              style={{
                borderRadius: 0,
                height: "48px",
                fontSize: "14px",
                fontWeight: 600,
                borderBottom:
                  activeTab === "login"
                    ? "2px solid var(--win11-accent)"
                    : "none",
              }}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>

            <button
              className={`flex-1 ${
                activeTab === "register" ? "btn-accent" : "btn-ghost"
              }`}
              style={{
                borderRadius: 0,
                height: "48px",
                fontSize: "14px",
                fontWeight: 600,
                borderBottom:
                  activeTab === "register"
                    ? "2px solid var(--win11-accent)"
                    : "none",
              }}
              onClick={() => setActiveTab("register")}
            >
              Register
            </button>
          </div>

          {/* Form content */}
          <div
            style={{
              padding: "24px",
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {activeTab === "login" ? (
              <LoginForm authAPI={authAPI} />
            ) : (
              <RegisterForm authAPI={authAPI} />
            )}
          </div>
        </div>
      </div>

      {/* ================= INFO  ================= */}
      <div
        className="window"
        style={{ width: "360px", padding: "16px", fontSize: "13px" }}
      >
        <div className="titlebar">
          <span className="titlebar-title">Informacije o sistemu</span>
        </div>

        <div
          className="window-content"
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <InfoBox
            title="Autentifikacija"
            color="#dbeafe"
            items={[
              "Svi korisnici moraju biti autentifikovani",
              "Korisničko ime mora biti jedinstveno",
              "Lozinka mora imati najmanje 6 karaktera",
            ]}
          />

          <InfoBox
            title="Menadžer prodaje"
            color="#dcfce7"
            items={[
              "Pristup distributivnom centru",
              "3 ambalaže po smjeni",
              "Vrijeme obrade: 0.5s po ambalaži",
              "Pregled svih fiskalnih računa",
            ]}
          />

          <InfoBox
            title="Prodavač"
            color="#ffedd5"
            items={[
              "Pristup magacinskom centru",
              "1 ambalaža po smjeni",
              "Vrijeme obrade: 2.5s po ambalaži",
              "Kreiranje fiskalnih računa",
            ]}
          />

          <InfoBox
            title="Bezbednost"
            color="#f3e8ff"
            items={[
              "Lozinke su enkriptovane",
              "Sesija ističe nakon 30 minuta",
              "Evidencija svih aktivnosti",
            ]}
          />

          <div style={{ textAlign: "right", fontSize: "11px", opacity: 0.6 }}>
            Verzija sistema: 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};


type InfoBoxProps = {
  title: string;
  items: string[];
  color: string;
};

const InfoBox: React.FC<InfoBoxProps> = ({ title, items, color }) => (
  <div
    style={{
      backgroundColor: color,
      padding: "10px 12px",
      borderRadius: "6px",
      color: "#000",
    }}
  >
    <strong style={{ display: "block", marginBottom: "6px" }}>{title}</strong>
    <ul style={{ paddingLeft: "16px", margin: 0 }}>
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  </div>
);
