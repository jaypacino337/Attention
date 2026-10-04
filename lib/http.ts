/**
 * PORTED from memcoinz .claude/skills/launchpad-site/preset-seats/lib/http.ts,
 * plus a 503 for StorageUnconfigured.
 */
import { NextResponse } from "next/server";
import { SeatError } from "./seats-core";
import { StorageUnconfigured } from "./store";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

export function fail(err: unknown) {
  if (err instanceof SeatError) return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  if (err instanceof StorageUnconfigured) return NextResponse.json({ error: "Linking opens as soon as storage is configured.", code: "STORAGE" }, { status: 503 });
  const msg = (err as Error).message ?? "error";
  if (msg === "Unknown coin" || msg === "bad mint") return NextResponse.json({ error: "Unknown coin" }, { status: 404 });
  console.error(err);
  return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
}

const hits = new Map<string, number[]>();
/** Tiny in-memory rate limit (per instance): `limit` calls per `windowMs` per key. */
export function rateLimited(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
