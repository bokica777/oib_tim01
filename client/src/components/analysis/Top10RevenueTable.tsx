import React from "react";

type Row = {
  parfemId: number;
  nazivParfema: string;
  kolicina: string | number;
  prihod: string | number;
};

function toNumber(x: any) {
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x);
  return 0;
}

export const Top10RevenueTable: React.FC<{
  title: string;
  rows: Row[];
  totalRevenueTop10: number;
}> = ({ title, rows, totalRevenueTop10 }) => {
  const money = new Intl.NumberFormat("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const intFmt = new Intl.NumberFormat("sr-RS");

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

      {rows.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>Nema podataka za Top 10.</div>
      ) : (
        <>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead>
              <tr>
                <th align="left">#</th>
                <th align="left">Naziv</th>
                <th align="right">Količina</th>
                <th align="right">Prihod</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x, idx) => (
                <tr key={`${x.parfemId}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{x.nazivParfema}</td>
                  <td align="right">{intFmt.format(toNumber(x.kolicina))}</td>
                  <td align="right">{money.format(toNumber(x.prihod))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 8, fontWeight: 900 }}>
            Ukupan prihod top 10: {money.format(totalRevenueTop10)} RSD
          </div>
        </>
      )}
    </div>
  );
};
