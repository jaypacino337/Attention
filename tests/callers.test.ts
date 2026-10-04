import assert from "node:assert/strict";
import { test } from "node:test";
import { X_POOL, X_WINDOW_MS } from "../lib/config";
import { callersView, claimCallout, expire, newAttentionCoin, phraseFor, sweepCallers } from "../lib/callers";
import { type SeatError, type VerifiedPost, base58, postTime } from "../lib/seats-core";

const W = (n: number) => base58(Uint8Array.from({ length: 32 }, (_, i) => (i * 7 + n * 13 + 1) % 256));
const MINT = W(99);
const DAY = 86_400_000;
const T0 = 1_791_000_000_000;

/** A post by @x at T0 + sec seconds carrying `wallet`'s phrase. */
let seq = 1n;
function post(wallet: string, x: string, sec: number, text?: string): VerifiedPost {
  const pid = (((BigInt(T0) + BigInt(sec) * 1000n - 1288834974657n) << 22n) | seq++).toString();
  return { id: pid, handle: x, text: text ?? `gm. ${phraseFor(MINT, wallet)} 🚀`, postedAt: postTime(pid) };
}
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as SeatError).code;
  }
  return "OK";
};

test("registry starts empty: no creator seat in the 𝕏 pool", () => {
  const c = newAttentionCoin(MINT);
  assert.equal(c.seats.length, 0);
  assert.equal(c.symbol, "ATTENTION");
  assert.ok(phraseFor(MINT, W(1)).startsWith(`@${X_POOL.handle} $ATTENTION give me a seat · `));
});

test("a callout seats its wallet; the code binds the post to that wallet", () => {
  const c = newAttentionCoin(MINT);
  const r = claimCallout(c, W(1), post(W(1), "alice", 1), T0 + 10_000);
  assert.equal(r.status, "seated");
  assert.equal(c.seats.length, 1);
  if (r.status === "seated") assert.equal(r.expiresAt, postTime(c.seats[0].postId!) + X_WINDOW_MS);
  // Bob reuses Alice's phrase for his own wallet: wrong code
  assert.equal(code(() => claimCallout(c, W(2), post(W(1), "bob", 2), T0 + 10_000)), "WRONG_PHRASE");
  // one account, one wallet
  assert.equal(code(() => claimCallout(c, W(3), post(W(3), "alice", 3), T0 + 10_000)), "X_USED");
  // the same post twice
  const p = post(W(4), "carol", 4);
  claimCallout(c, W(4), p, T0 + 10_000);
  assert.equal(code(() => claimCallout(c, W(4), p, T0 + 10_000)), "POST_USED");
});

test("stale posts are refused", () => {
  const c = newAttentionCoin(MINT);
  assert.equal(code(() => claimCallout(c, W(1), post(W(1), "alice", 0), T0 + X_WINDOW_MS + 5_000)), "POST_TOO_OLD");
});

test("seats lapse after the window unless renewed by a newer post", () => {
  const c = newAttentionCoin(MINT);
  claimCallout(c, W(1), post(W(1), "alice", 0), T0);
  claimCallout(c, W(2), post(W(2), "bob", 0), T0);
  // Alice renews on day 5 with a new post
  const r = claimCallout(c, W(1), post(W(1), "alice", 5 * 86_400), T0 + 5 * DAY);
  assert.equal(r.status, "renewed");
  // an older post can't "renew"
  assert.equal(code(() => claimCallout(c, W(1), post(W(1), "alice", 60), T0 + 5 * DAY)), "POST_USED");
  // day 8: Bob lapsed, Alice is live until day 12
  const view = callersView(c, T0 + 8 * DAY);
  assert.deepEqual(view.seats.map((s) => s.x), ["alice"]);
  assert.equal(c.seats.length, 2, "view is read-only");
  assert.deepEqual(expire(c, T0 + 8 * DAY).map((s) => s.x), ["bob"]);
  // Bob comes back with a fresh post
  assert.equal(claimCallout(c, W(2), post(W(2), "bob", 8 * 86_400), T0 + 8 * DAY).status, "seated");
});

test("renewal must come from the same 𝕏 account", () => {
  const c = newAttentionCoin(MINT);
  claimCallout(c, W(1), post(W(1), "alice", 0), T0);
  assert.equal(code(() => claimCallout(c, W(1), post(W(1), "alice2", 10), T0)), "WALLET_SEATED");
});

test("sweep: sellers and lapsed seats go, unknown balances stay", () => {
  const c = newAttentionCoin(MINT);
  claimCallout(c, W(1), post(W(1), "a", 0), T0);
  claimCallout(c, W(2), post(W(2), "b", 3 * 86_400), T0 + 3 * DAY);
  claimCallout(c, W(3), post(W(3), "c", 3 * 86_400), T0 + 3 * DAY);
  const res = sweepCallers(c, new Map([[W(2), 100]]), T0 + 8 * DAY); // W(3) unknown
  assert.deepEqual(res.lapsed.map((s) => s.x), ["a"]);
  assert.deepEqual(res.freed.map((s) => s.x), ["b"]);
  assert.deepEqual(c.seats.map((s) => s.x), ["c"]);
});

test("view matches the memcoinz /api/seats contract (seats[].wallet)", () => {
  const c = newAttentionCoin(MINT);
  claimCallout(c, W(1), post(W(1), "alice", 0), T0);
  const v = callersView(c, T0 + 1000);
  assert.equal(v.seatsTaken, 1);
  assert.equal(v.seats[0].wallet, W(1));
  assert.equal(v.seats[0].label, "1A");
  assert.equal(v.handle, X_POOL.handle);
});
