/**
 * Supabase backend over its REST API (PostgREST): no SDK dependency.
 * PORTED from memcoinz .claude/skills/launchpad-site/preset-seats/lib/store.supabase.ts
 * (table renamed to `attention_seats` so it can share a Supabase project with
 * Jay's other products; pending-launch methods dropped).
 *
 * Table: supabase/schema.sql (RLS on, no public policies, so only the
 * service-role key used here, server-side, can read or write).
 *
 * Concurrency: every row has a `version`. updateCoin reads (data, version),
 * applies the change, and writes only `WHERE version = <read version>`. If another
 * instance won the race, 0 rows change, so we re-read and retry. No lost links,
 * no double claims, across any number of serverless instances.
 */
import type { SeatCoin } from "./seats-core";
import type { CallerStore } from "./store";

const MAX_RETRIES = 8;
export const TABLE = "attention_seats";

export function supabaseStore(url: string, serviceKey: string, fetchImpl: typeof fetch = fetch): CallerStore {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = (extra: Record<string, string> = {}) => ({
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
    ...extra,
  });
  async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, { ...init, headers: headers(init.prefer ? { prefer: init.prefer } : {}), cache: "no-store" });
    if (!res.ok) throw new Error(`Supabase ${init.method ?? "GET"} ${path.split("?")[0]} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }
  const safe = (mint: string) => {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error("bad mint");
    return encodeURIComponent(mint);
  };

  return {
    backend: "supabase",
    async getCoin(mint) {
      const rows = await rest<{ data: SeatCoin }[]>(`/${TABLE}?select=data&mint=eq.${safe(mint)}`);
      return rows[0]?.data ?? null;
    },
    async updateCoin(mint, fn) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const rows = await rest<{ data: SeatCoin; version: number }[]>(`/${TABLE}?select=data,version&mint=eq.${safe(mint)}`);
        if (!rows[0]) throw new Error("Unknown coin");
        const { data: coin, version } = rows[0];
        const out = await fn(coin);
        const written = await rest<unknown[]>(`/${TABLE}?mint=eq.${safe(mint)}&version=eq.${version}`, {
          method: "PATCH",
          prefer: "return=representation",
          body: JSON.stringify({ data: coin, version: version + 1, updated_at: new Date().toISOString() }),
        });
        if (written.length === 1) return out;
        // lost the race: someone else wrote first. Back off a little and retry on fresh data.
        await new Promise((r) => setTimeout(r, 15 + Math.random() * 40 * (attempt + 1)));
      }
      throw new Error("Busy: too many simultaneous updates, try again");
    },
    async createCoin(coin) {
      await rest(`/${TABLE}?on_conflict=mint`, {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=minimal",
        body: JSON.stringify({ mint: coin.mint, data: coin, version: 0 }),
      });
    },
  };
}
