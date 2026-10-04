import { TOKEN } from "./config";
import { callersView, newAttentionCoin, type CallersView } from "./callers";
import type { SeatCoin } from "./seats-core";
import { getStore, requireStore } from "./store";

/** The $ATTENTION registry row, created on first write. */
export async function ensureCoin(): Promise<SeatCoin> {
  const store = requireStore();
  const existing = await store.getCoin(TOKEN.mint);
  if (existing) return existing;
  await store.createCoin(newAttentionCoin(TOKEN.mint));
  return (await store.getCoin(TOKEN.mint))!;
}

/** Read-only view for pages and GET /api/seats. Never creates a row; never throws on storage errors. */
export async function readCallers(): Promise<{ view: CallersView; storage: "supabase" | "file" | "unconfigured" | "error" }> {
  const store = getStore();
  const empty = callersView(newAttentionCoin(TOKEN.mint));
  if (!store) return { view: empty, storage: "unconfigured" };
  try {
    const coin = await store.getCoin(TOKEN.mint);
    return { view: coin ? callersView(coin) : empty, storage: store.backend };
  } catch (err) {
    console.error(err);
    return { view: empty, storage: "error" };
  }
}
