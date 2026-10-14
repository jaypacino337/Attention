/**
 * Private-send route planner. Pure and deterministic given an rng, so the same
 * code draws the homepage demo (seeded) and plans real sends (crypto random).
 *
 * A route splits the amount into real parts. Each part leaves the sender,
 * hops through one or two throwaway relays and lands at the recipient. Decoys
 * are sized like real parts and take the same kind of path, but come back to
 * the sender. Every relay forwards exactly what it received, so all relays end
 * the transaction at zero. Transfers are interleaved in a random order that
 * still respects each path's own order (a relay never sends before it receives).
 */

export type Node = { kind: "you" } | { kind: "recipient" } | { kind: "relay"; index: number };
export type Transfer = { from: Node; to: Node; lamports: bigint; real: boolean };
export type Level = "light" | "standard" | "maximum";

export const LEVELS: Record<Level, { label: string; relays: number; parts: number; decoys: number; blurb: string }> = {
  light: { label: "Light", relays: 2, parts: 2, decoys: 1, blurb: "Smallest, cheapest route." },
  standard: { label: "Standard", relays: 3, parts: 3, decoys: 2, blurb: "The everyday default." },
  maximum: { label: "Maximum", relays: 5, parts: 4, decoys: 5, blurb: "As many relays and decoys as one transaction holds." },
};

export type Route = { level: Level; relays: number; transfers: Transfer[]; realParts: bigint[] };

export type Rng = () => number;

/** Small seeded PRNG for reproducible demos. Never used for real sends. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cryptographic randomness for real routes, so a route can't be predicted. */
export function cryptoRng(): Rng {
  return () => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  };
}

const pick = <T,>(rng: Rng, list: T[]) => list[Math.floor(rng() * list.length)];

/** Split `total` into `n` uneven positive parts that sum exactly to `total`. */
export function splitAmount(total: bigint, n: number, rng: Rng): bigint[] {
  if (n <= 1 || total < BigInt(n)) return [total];
  const weights = Array.from({ length: n }, () => 0.35 + rng() * 1.3);
  const sum = weights.reduce((s, w) => s + w, 0);
  const parts = weights.map((w) => (total * BigInt(Math.round((w / sum) * 1e6))) / 1_000_000n);
  const assigned = parts.slice(0, -1).reduce((s, p) => s + p, 0n);
  parts[n - 1] = total - assigned;
  return parts.every((p) => p > 0n) ? parts : [total];
}

function path(rng: Rng, relays: number): number[] {
  const first = Math.floor(rng() * relays);
  if (relays < 2 || rng() < 0.45) return [first];
  const second = pick(rng, Array.from({ length: relays }, (_, i) => i).filter((i) => i !== first));
  return [first, second];
}

export function planRoute(totalLamports: bigint, level: Level, rng: Rng): Route {
  const cfg = LEVELS[level];
  const realParts = splitAmount(totalLamports, cfg.parts, rng);
  const lo = realParts.reduce((m, p) => (p < m ? p : m), realParts[0]);
  const hi = realParts.reduce((m, p) => (p > m ? p : m), realParts[0]);

  // each flow is an ordered chain of transfers
  const flows: Transfer[][] = [];
  const you: Node = { kind: "you" };
  const recipient: Node = { kind: "recipient" };
  const chain = (amount: bigint, hops: number[], end: Node, real: boolean) => {
    const nodes: Node[] = [you, ...hops.map((index) => ({ kind: "relay", index }) as Node), end];
    flows.push(nodes.slice(1).map((to, i) => ({ from: nodes[i], to, lamports: amount, real })));
  };
  for (const part of realParts) chain(part, path(rng, cfg.relays), recipient, true);
  for (let d = 0; d < cfg.decoys; d++) {
    // decoys look like real parts: same size range, same kind of path
    const span = hi - lo;
    const amount = lo + (span > 0n ? (span * BigInt(Math.floor(rng() * 1e6))) / 1_000_000n : 0n);
    chain(amount > 0n ? amount : lo, path(rng, cfg.relays), you, false);
  }

  // random interleave that keeps every flow in its own order
  const cursors = flows.map(() => 0);
  const transfers: Transfer[] = [];
  for (;;) {
    const open = flows.map((f, i) => i).filter((i) => cursors[i] < flows[i].length);
    if (!open.length) break;
    const i = pick(rng, open);
    transfers.push(flows[i][cursors[i]++]);
  }
  return { level, relays: cfg.relays, transfers, realParts };
}

/** Net lamport change per node, as a block explorer would summarise it. */
export function netChanges(route: Route) {
  const key = (n: Node) => (n.kind === "relay" ? `relay${n.index}` : n.kind);
  const net = new Map<string, bigint>();
  for (const t of route.transfers) {
    net.set(key(t.from), (net.get(key(t.from)) ?? 0n) - t.lamports);
    net.set(key(t.to), (net.get(key(t.to)) ?? 0n) + t.lamports);
  }
  return net;
}

export const nodeLabel = (n: Node) => (n.kind === "relay" ? `Relay ${n.index + 1}` : n.kind === "you" ? "You" : "Recipient");

export const LAMPORTS = 1_000_000_000n;
export function toLamports(sol: string): bigint | null {
  const m = sol.trim().match(/^(\d*)(?:\.(\d{0,9})\d*)?$/);
  if (!m || (!m[1] && !m[2])) return null;
  return BigInt(m[1] || "0") * LAMPORTS + BigInt((m[2] || "").padEnd(9, "0"));
}
export function fmtSol(lamports: bigint, digits = 4): string {
  const n = Number(lamports) / 1e9;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) });
}
