import type { Cell, Piece, PieceType, PlayerId, PlayerState, RoomState } from "./types";

export const W = 10;
export const H = 20;

export const COLORS: Record<PieceType, Cell> = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7
};

const SHAPES: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
  ],
  O: [
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]]
  ],
  T: [
    [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
  ],
  J: [
    [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]]
  ],
  L: [
    [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]]
  ],
  S: [
    [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]
  ],
  Z: [
    [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]
  ]
};

const KICKS: Record<string, [number, number][]> = {
  "0>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "1>0": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "1>2": [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "2>1": [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "2>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "3>2": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "3>0": [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "0>3": [[0,0],[1,0],[1,1],[0,-2],[1,-2]]
};

export function emptyBoard(): Cell[][] {
  return Array.from({ length: H }, () => Array<Cell>(W).fill(0));
}

function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

export function bag(seed: number): PieceType[] {
  const r = rng(seed);
  const a: PieceType[] = ["I","O","T","S","Z","J","L"];
  for (let i = 6; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQueue(seed: number, n = 14): PieceType[] {
  const out: PieceType[] = [];
  let s = seed >>> 0;
  while (out.length < n) {
    out.push(...bag(s));
    s = (s + 0x9e3779b9) >>> 0;
  }
  return out.slice(0, n);
}

export function spawn(type: PieceType): Piece {
  return { type, rotation: 0, x: 3, y: -1 };
}

export function shapeCells(piece: Piece): [number, number][] {
  const shape = SHAPES[piece.type][piece.rotation % 4];
  const out: [number, number][] = [];
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++)
    if (shape[y][x]) out.push([piece.x + x, piece.y + y]);
  return out;
}

export function collides(board: Cell[][], piece: Piece): boolean {
  for (const [x, y] of shapeCells(piece)) {
    if (x < 0 || x >= W || y >= H) return true;
    if (y >= 0 && board[y][x]) return true;
  }
  return false;
}

export function move(board: Cell[][], p: Piece, dx: number, dy: number): Piece | null {
  const next = { ...p, x: p.x + dx, y: p.y + dy };
  return collides(board, next) ? null : next;
}

export function rotate(board: Cell[][], p: Piece, dir: 1 | -1): Piece | null {
  if (p.type === "O") return p;
  const from = p.rotation;
  const to = (from + (dir === 1 ? 1 : 3)) % 4;
  const kicks = KICKS[`${from}>${to}`];
  for (const [dx, dy] of kicks) {
    const next = { ...p, rotation: to, x: p.x + dx, y: p.y - dy };
    if (!collides(board, next)) return next;
  }
  return null;
}

export function hardDrop(board: Cell[][], p: Piece): Piece {
  let out = p;
  while (true) {
    const next = move(board, out, 0, 1);
    if (!next) return out;
    out = next;
  }
}

function lock(board: Cell[][], p: Piece): Cell[][] {
  const b = board.map(r => r.slice());
  for (const [x, y] of shapeCells(p))
    if (x >= 0 && x < W && y >= 0 && y < H) b[y][x] = COLORS[p.type];
  return b;
}

function clearLines(board: Cell[][]) {
  const kept = board.filter(row => row.some(c => c === 0));
  const lines = H - kept.length;
  return {
    board: [...Array.from({ length: lines }, () => Array<Cell>(W).fill(0)), ...kept],
    lines
  };
}

function garbage(board: Cell[][], amount: number, seed: number): Cell[][] {
  let b = board.map(r => r.slice());
  const r = rng(seed);
  for (let i = 0; i < amount; i++) {
    b.shift();
    const hole = Math.floor(r() * W);
    const row = Array<Cell>(W).fill(1);
    row[hole] = 0;
    b.push(row);
  }
  return b;
}

function attack(lines: number, combo: number) {
  const base = [0, 0, 1, 2, 4][Math.min(lines, 4)] ?? 0;
  return base + (combo >= 2 ? Math.min(combo - 1, 4) : 0);
}

export function createPlayer(seed: number): PlayerState {
  const q = makeQueue(seed);
  return {
    board: emptyBoard(),
    queue: q.slice(1),
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    pieces: 0,
    combo: -1,
    lastClear: 0,
    alive: true
  };
}

export function initialRoom(code: string, p1: string, seed: number): RoomState {
  return {
    code,
    players: { p1, p2: null },
    playerState: { p1: createPlayer(seed), p2: createPlayer(seed ^ 0xa53c9e31) },
    turn: "p1",
    started: false,
    winner: null,
    updatedAt: Date.now()
  };
}

export function place(state: RoomState, pid: PlayerId, piece: Piece, seed: number): RoomState {
  if (state.turn !== pid || !state.started || state.winner) throw new Error("Not your turn");
  const ps = state.playerState[pid];
  if (!ps.alive || piece.type !== ps.queue[0] || collides(ps.board, piece)) throw new Error("Invalid placement");

  const dropped = hardDrop(ps.board, piece);
  const locked = lock(ps.board, dropped);
  const result = clearLines(locked);
  const combo = result.lines ? ps.combo + 1 : -1;
  const score = [0,100,300,500,800][result.lines] * (combo > 0 ? combo + 1 : 1);
  const atk = attack(result.lines, combo);
  const nextQueue = [...ps.queue.slice(1), ...makeQueue(seed + ps.pieces + 1, 7)];
  const next: PlayerState = {
    ...ps,
    board: result.board,
    queue: nextQueue,
    score: ps.score + score,
    lines: ps.lines + result.lines,
    pieces: ps.pieces + 1,
    combo,
    lastClear: result.lines,
    canHold: true
  };

  const other: PlayerId = pid === "p1" ? "p2" : "p1";
  let otherState = state.playerState[other];
  if (atk) otherState = { ...otherState, board: garbage(otherState.board, atk, seed ^ ps.pieces) };
  if (otherState.board.some(row => row.every(Boolean))) otherState = { ...otherState, alive: false };

  return {
    ...state,
    playerState: { ...state.playerState, [pid]: next, [other]: otherState },
    turn: other,
    winner: otherState.alive ? null : pid,
    updatedAt: Date.now()
  };
}
