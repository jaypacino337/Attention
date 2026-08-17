import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Wallet sessions.
 *
 * A session is an HMAC-signed token in an HttpOnly cookie, issued only after
 * the server has verified an ed25519 signature from the wallet. It records
 * *who* the visitor is; it deliberately does not record their balance, so a
 * wallet that sells below the gate loses terminal access on the next request
 * instead of coasting on a stale claim until the cookie expires.
 */

const COOKIE = "am_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ random chars) in production");
  }
  // Dev-only fallback so `next dev` runs before .env.local exists.
  return "dev-only-insecure-session-secret";
}

type Payload = { wallet: string; issuedAt: number };

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function encode(payload: Payload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): Payload | null {
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = sign(body);
  // Constant-time compare; length check first because timingSafeEqual throws
  // on a length mismatch.
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (typeof payload.wallet !== "string" || typeof payload.issuedAt !== "number") {
      return null;
    }
    if (Date.now() - payload.issuedAt > MAX_AGE_SECONDS * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(wallet: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encode({ wallet, issuedAt: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** The verified wallet for this request, or null if unauthenticated. */
export async function getSessionWallet(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return decode(token)?.wallet ?? null;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
