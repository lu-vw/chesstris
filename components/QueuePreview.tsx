import { COLORS, shapeCells, spawn } from "../lib/game";
import type { PieceType } from "../lib/types";

export default function QueuePreview({ pieces, label }: { pieces: PieceType[]; label: string }) {
  return <section className="piece-queue" aria-label={`${label} next pieces`}>
    <h3>{label}</h3>
    <ol>
      {pieces.slice(0, 5).map((type, index) => {
        const cells = new Set(shapeCells(spawn(type)).map(([x, y]) => `${x - 3}-${y + 1}`));
        return <li key={`${index}-${type}`}>
          <span className="queue-number">{index + 1}</span>
          <span className="piece-preview" aria-label={`${type} piece`}>
            {Array.from({ length: 16 }, (_, cell) => {
              const x = cell % 4;
              const y = Math.floor(cell / 4);
              return <i
                key={cell}
                className={cells.has(`${x}-${y}`) ? `c${COLORS[type]}` : ""}
              />;
            })}
          </span>
          <span className="piece-name">{type}</span>
        </li>;
      })}
    </ol>
  </section>;
}
