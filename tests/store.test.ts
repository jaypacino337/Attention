import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { claimCallout, newAttentionCoin, phraseFor } from "../lib/callers";
import { base58, postTime, type VerifiedPost } from "../lib/seats-core";
import { fileStore } from "../lib/store.file";
import { TABLE, supabaseStore } from "../lib/store.supabase";

const W = (n: number) => base58(Uint8Array.from({ length: 32 }, (_, i) => (i * 7 + n * 13 + 1) % 256));
const MINT = W(99);
const NOW = Date.now();
function post(n: number): VerifiedPost {
  const pid = (((BigInt(NOW - 60_000) + BigInt(n) - 1288834974657n) << 22n) | 1n).toString();
  return { id: pid, handle: `user${n}`, text: phraseFor(MINT, W(n)), postedAt: postTime(pid) };
}

/**
 * In-memory PostgREST for one table: GET/POST/PATCH with eq filters, `version`
 * guarded PATCH, and an artificial delay so concurrent requests interleave.
 */
function fakePostgrest() {
  const rows = new Map<string, { mint: string; data: unknown; version: number }>();
  let patches = 0;
  let conflicts = 0;
  const tick = () => new Promise((r) => setTimeout(r, Math.random() * 5));
  const impl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.ok(url.pathname.endsWith(`/rest/v1/${TABLE}`));
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers.apikey, "service-key");
    const eq = (k: string) => url.searchParams.get(k)?.replace(/^eq\./, "");
    await tick();
    const method = init?.method ?? "GET";
    if (method === "GET") {
      const r = rows.get(eq("mint")!);
      return new Response(JSON.stringify(r ? [structuredClone(r)] : []));
    }
    if (method === "POST") {
      const body = JSON.parse(String(init!.body));
      if (!rows.has(body.mint)) rows.set(body.mint, body);
      return new Response("");
    }
    if (method === "PATCH") {
      patches++;
      const r = rows.get(eq("mint")!);
      const body = JSON.parse(String(init!.body));
      if (!r || r.version !== Number(eq("version"))) {
        conflicts++;
        return new Response("[]");
      }
      rows.set(r.mint, { mint: r.mint, data: body.data, version: body.version });
      return new Response(JSON.stringify([body]));
    }
    return new Response("nope", { status: 405 });
  }) as typeof fetch;
  return { impl, rows, stats: () => ({ patches, conflicts }) };
}

test("supabase store: 25 concurrent claims from 5 'instances' lose no writes", async () => {
  const pg = fakePostgrest();
  const instances = Array.from({ length: 5 }, () => supabaseStore("https://x.supabase.co/", "service-key", pg.impl));
  await instances[0].createCoin(newAttentionCoin(MINT));
  await instances[1].createCoin(newAttentionCoin(MINT)); // idempotent
  await Promise.all(
    Array.from({ length: 25 }, (_, i) => instances[i % 5].updateCoin(MINT, (c) => claimCallout(c, W(i + 1), post(i + 1)))),
  );
  const row = pg.rows.get(MINT)!;
  const coin = (await instances[2].getCoin(MINT))!;
  assert.equal(coin.seats.length, 25);
  assert.equal(new Set(coin.seats.map((s) => s.index)).size, 25, "every seat index unique");
  assert.equal(row.version, 25, "one version bump per successful write");
  assert.ok(pg.stats().conflicts > 0, "the race actually happened and was retried");
});

test("supabase store: a duplicate claim fails on every instance and writes nothing", async () => {
  const pg = fakePostgrest();
  const a = supabaseStore("https://x.supabase.co", "service-key", pg.impl);
  const b = supabaseStore("https://x.supabase.co", "service-key", pg.impl);
  await a.createCoin(newAttentionCoin(MINT));
  await a.updateCoin(MINT, (c) => claimCallout(c, W(1), post(1)));
  await assert.rejects(b.updateCoin(MINT, (c) => claimCallout(c, W(1), post(1))), /already|used/i);
  assert.equal(pg.rows.get(MINT)!.version, 1);
  await assert.rejects(a.getCoin("not a mint"), /bad mint/);
});

test("file store: concurrent claims serialise and persist", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "attn-"));
  const s = fileStore(dir);
  await s.createCoin(newAttentionCoin(MINT));
  await Promise.all(Array.from({ length: 10 }, (_, i) => s.updateCoin(MINT, (c) => claimCallout(c, W(i + 1), post(i + 1)))));
  const again = fileStore(dir); // a "restart"
  assert.equal((await again.getCoin(MINT))!.seats.length, 10);
  fs.rmSync(dir, { recursive: true });
});
