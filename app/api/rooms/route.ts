import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { initialRoom } from "../../../lib/game";

const redis = Redis.fromEnv();

export async function POST(req: Request) {
  const { playerId } = await req.json();
  if (!playerId) return NextResponse.json({ error: "playerId required" }, { status: 400 });

  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const room = initialRoom(code, playerId, Date.now() ^ i);
    const created = await redis.set(`chesstris:${code}`, JSON.stringify(room), { nx: true, ex: 43200 });
    if (created) return NextResponse.json({ code, state: room });
  }
  return NextResponse.json({ error: "Could not create room" }, { status: 500 });
}
