/**
 * Storage for the 𝕏 caller registry, chosen by env.
 * PORTED from memcoinz .claude/skills/launchpad-site/preset-seats/lib/store.ts
 * (launch-pending methods dropped: Attention doesn't launch coins).
 *
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Supabase (lib/store.supabase.ts),
 *     safe on Vercel / many instances: jsonb + `version` optimistic locking.
 *   otherwise, in dev or on a server with a disk → JSON files (lib/store.file.ts).
 *   otherwise, on Vercel → "unconfigured": reads are empty and writes refuse,
 *     because Vercel's disk is ephemeral and would silently lose links.
 */
import type { SeatCoin } from "./seats-core";
import { fileStore } from "./store.file";
import { supabaseStore } from "./store.supabase";

export interface CallerStore {
  readonly backend: "supabase" | "file";
  getCoin(mint: string): Promise<SeatCoin | null>;
  /** Atomic read-modify-write: `fn` mutates the coin; its return value passes through. */
  updateCoin<T>(mint: string, fn: (coin: SeatCoin) => T | Promise<T>): Promise<T>;
  /** Insert if absent (idempotent). */
  createCoin(coin: SeatCoin): Promise<void>;
}

export class StorageUnconfigured extends Error {
  constructor() {
    super("Storage isn't configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
}

let chosen: CallerStore | null | undefined;

/** The active store, or null when running on Vercel without Supabase. */
export function getStore(): CallerStore | null {
  if (chosen !== undefined) return chosen;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VERCEL } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) chosen = supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  else if (VERCEL) chosen = null;
  else chosen = fileStore();
  return chosen;
}

export function requireStore(): CallerStore {
  const s = getStore();
  if (!s) throw new StorageUnconfigured();
  return s;
}
