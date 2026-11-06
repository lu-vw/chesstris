import type { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { PlayerId } from "../../../../lib/types";
import { place } from "../../../../lib/game";
import { getRedisClient } from "../../../../lib/redis";

const redis = getRedisClient();
const key = (code: string) => `chesstris:${code.toUpperCase()}`;

async function getRoom(redis: Redis, code: string) {
  const raw = await redis.get<string>(key(code));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!redis) {
    return NextResponse.json(
      { error: "Room storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." },
      { status: 503 },
    );
  }

  const { code } = await params;
  const room = await getRoom(redis, code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!redis) {
    return NextResponse.json(
      { error: "Room storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." },
      { status: 503 },
    );
  }

  const { code } = await params;
  const body = await req.json();
  const room = await getRoom(redis, code);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  if (body.action === "join") {
    if (room.players.p2 && room.players.p2 !== body.token)
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    room.players.p2 = body.token;
    room.started = true;
    room.updatedAt = Date.now();
    await redis.set(key(code), JSON.stringify(room), { ex: 43200 });
    return NextResponse.json(room);
  }

  const pid = body.playerId as PlayerId;
  if ((pid !== "p1" && pid !== "p2") || room.players[pid] !== body.token)
    return NextResponse.json({ error: "Not your player slot" }, { status: 403 });

  if (body.action === "place") {
    try {
      const next = place(room, pid, body.piece, Date.now());
      await redis.set(key(code), JSON.stringify(next), { ex: 43200 });
      return NextResponse.json(next);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid move" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
