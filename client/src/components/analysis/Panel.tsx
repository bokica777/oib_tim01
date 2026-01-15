import React from "react";

export const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
};
