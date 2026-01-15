import React from "react";

type StorageLogProps = {
  logs?: (string | null | undefined)[];
};

const StorageLog: React.FC<StorageLogProps> = ({ logs }) => {
  const safeLogs = Array.isArray(logs) ? logs.filter(Boolean) : [];

  return (
    <div>
      <strong>System log</strong>
      <div
        style={{
          marginTop: 8,
          maxHeight: 260,
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: 8,
        }}
      >
        {safeLogs.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nema logova</div>
        ) : (
          safeLogs.map((l, i) => <div key={i}>{l}</div>)
        )}
      </div>
    </div>
  );
};

export default StorageLog;
