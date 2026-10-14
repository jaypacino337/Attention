import { test } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";
import { LEVELS, netChanges, planRoute, seeded, splitAmount, toLamports, type Level } from "../lib/route";
import { buildSendTx, TX_LIMIT } from "../lib/send-tx";

const levels = Object.keys(LEVELS) as Level[];

test("split always sums to the total", () => {
  for (let s = 1; s < 300; s++) {
    const total = BigInt(1 + Math.floor(seeded(s)() * 5e10));
    const parts = splitAmount(total, 4, seeded(s * 7));
    assert.equal(parts.reduce((a, b) => a + b, 0n), total);
    assert.ok(parts.every((p) => p > 0n));
  }
});

test("recipient gets exactly the amount, relays end at zero, never overspend", () => {
  for (const level of levels) {
    for (let s = 1; s < 400; s++) {
      const total = 12_500_000_000n + BigInt(s);
      const route = planRoute(total, level, seeded(s));
      const net = netChanges(route);
      assert.equal(net.get("recipient"), total);
      assert.equal(net.get("you"), -total);
      for (const [k, v] of net) if (k.startsWith("relay")) assert.equal(v, 0n, `${level} seed ${s} ${k}`);
      // running relay balances stay non-negative in transaction order
      const bal = new Map<number, bigint>();
      for (const t of route.transfers) {
        if (t.to.kind === "relay") bal.set(t.to.index, (bal.get(t.to.index) ?? 0n) + t.lamports);
        if (t.from.kind === "relay") {
          const b = (bal.get(t.from.index) ?? 0n) - t.lamports;
          assert.ok(b >= 0n, `${level} seed ${s}: relay ${t.from.index} overspends`);
          bal.set(t.from.index, b);
        }
      }
      assert.equal(route.transfers.filter((t) => !t.real && t.from.kind === "you").length, LEVELS[level].decoys);
    }
  }
});

test("every level fits in one transaction", () => {
  const sender = Keypair.generate().publicKey;
  const recipient = Keypair.generate().publicKey;
  for (const level of levels) {
    let max = 0;
    for (let s = 1; s < 300; s++) {
      const built = buildSendTx({ sender, recipient, lamports: 3_000_000_000n, level, rng: seeded(s), blockhash: "11111111111111111111111111111111" });
      built.tx.sign(built.relays); // signatures are already counted in size, but this proves the relay set is complete
      max = Math.max(max, built.bytes);
    }
    assert.ok(max <= TX_LIMIT, `${level} max ${max} bytes`);
  }
});

test("parses SOL amounts", () => {
  assert.equal(toLamports("1.5"), 1_500_000_000n);
  assert.equal(toLamports(".000000001"), 1n);
  assert.equal(toLamports("0.1234567899"), 123_456_789n);
  assert.equal(toLamports("abc"), null);
  assert.equal(toLamports(""), null);
});
