import type { Cell, Piece } from "../lib/types";
import { shapeCells } from "../lib/game";

export default function Board({ board, active }: { board: Cell[][]; active?: Piece }) {
  const cells = board.map(row => row.slice());
  if (active) {
    const color = ({I:1,O:2,T:3,S:4,Z:5,J:6,L:7} as const)[active.type];
    for (const [x,y] of shapeCells(active))
      if (x >= 0 && x < 10 && y >= 0 && y < 20) cells[y][x] = color;
  }

  return <div className="board">
    {cells.flatMap((row,y) => row.map((cell,x) =>
      <div key={`${x}-${y}`} className={`cell c${cell}`} />
    ))}
  </div>;
}
