import React from "react";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";

type Props = {
  perfumes: PerfumeDTO[];
  onDetails: (perfume: PerfumeDTO) => void;
};

const PerfumeTable: React.FC<Props> = ({ perfumes, onDetails }) => {
  if (perfumes.length === 0) {
    return <div>Nema dostupnih parfema</div>;
  }

  return (
    <table width="100%" cellPadding={6}>
      <thead>
        <tr>
          <th align="left">Naziv</th>
          <th align="left">Zapremina</th>
          <th align="left">Status</th>
        </tr>
      </thead>
      <tbody>
        {perfumes.map((p) => (
          <tr
            key={p.id}
            style={{ cursor: "pointer" }}
            onClick={() => onDetails(p)}
          >
            <td>{p.name}</td>
            <td>{p.volume} ml</td>
            <td>{p.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PerfumeTable;
