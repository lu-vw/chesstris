import type { Cell, Piece } from "../lib/types";
import { hardDrop, shapeCells } from "../lib/game";

export default function Board({ board, active, showGhost = false }: {
  board: Cell[][];
  active?: Piece;
  showGhost?: boolean;
}) {
  const cells = board.map(row => row.slice());
  const ghostCells = new Set<string>();

  if (active && showGhost) {
    const ghost = hardDrop(board, active);
    for (const [x, y] of shapeCells(ghost)) {
      if (x >= 0 && x < 10 && y >= 0 && y < 20) ghostCells.add(`${x}-${y}`);
    }
  }

  if (active) {
    const color = ({I:1,O:2,T:3,S:4,Z:5,J:6,L:7} as const)[active.type];
    for (const [x,y] of shapeCells(active))
      if (x >= 0 && x < 10 && y >= 0 && y < 20) cells[y][x] = color;
  }

  return <div className="board">
    {cells.flatMap((row,y) => row.map((cell,x) =>
      <div
        key={`${x}-${y}`}
        className={`cell c${cell}${ghostCells.has(`${x}-${y}`) && !cell ? " ghost" : ""}`}
      />
    ))}
  </div>;
}
