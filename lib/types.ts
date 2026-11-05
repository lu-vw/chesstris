export type PlayerId = "p1" | "p2";
export type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Piece = {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
};

export type PlayerState = {
  board: Cell[][];
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  pieces: number;
  combo: number;
  lastClear: number;
  alive: boolean;
};

export type RoomState = {
  code: string;
  players: { p1: string | null; p2: string | null };
  playerState: Record<PlayerId, PlayerState>;
  turn: PlayerId;
  started: boolean;
  winner: PlayerId | null;
  updatedAt: number;
};
