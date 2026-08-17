import assert from "node:assert/strict";
import { test } from "node:test";
import { FEE_SPLIT, MIN_ELIGIBLE, tierFor } from "../lib/config";
import { bucketAmounts, burnBudget, distributeEpoch } from "../lib/rewards";

test("fee split totals 100%", () => {
  assert.equal(
    FEE_SPLIT.reduce((sum, bucket) => sum + bucket.percent, 0),
    100,
  );
});

test("bucket amounts follow the 30/30/30/10 split", () => {
  const buckets = bucketAmounts(100);
  assert.equal(buckets.callouts, 30);
  assert.equal(buckets.fomo, 30);
  assert.equal(buckets.social, 30);
  assert.equal(buckets.treasury, 10);
});

test("tiers resolve at the documented thresholds", () => {
  assert.equal(tierFor(0).id, "none");
  assert.equal(tierFor(249_999).id, "none");
  assert.equal(tierFor(250_000).id, "base");
  assert.equal(tierFor(499_999).id, "base");
  assert.equal(tierFor(500_000).id, "full");
  assert.equal(tierFor(10_000_000).id, "full");
});

test("wallets below the minimum earn nothing", () => {
  const { payouts } = distributeEpoch(100, [
    { wallet: "small", balance: MIN_ELIGIBLE - 1, calloutScore: 999, socialScore: 999, xVerified: true },
  ]);
  assert.equal(payouts.length, 0);
});

test("operator tier earns double weight on an equal holding-independent score", () => {
  const { payouts } = distributeEpoch(100, [
    { wallet: "watcher", balance: 250_000, calloutScore: 10 },
    { wallet: "operator", balance: 500_000, calloutScore: 10 },
  ]);
  const watcher = payouts.find((p) => p.wallet === "watcher")!;
  const operator = payouts.find((p) => p.wallet === "operator")!;
  // Callout pool is 30; weights are 1 and 2, so 10 / 20 of the pool.
  assert.equal(Math.round(watcher.amounts.callouts * 100) / 100, 10);
  assert.equal(Math.round(operator.amounts.callouts * 100) / 100, 20);
});

test("social pool only pays verified X links", () => {
  const { payouts, unclaimed } = distributeEpoch(100, [
    { wallet: "unverified", balance: 300_000, socialScore: 500, xVerified: false },
  ]);
  const row = payouts.find((p) => p.wallet === "unverified")!;
  assert.equal(row.amounts.social, 0);
  // Nothing claimable, so the whole social bucket rolls forward.
  assert.equal(unclaimed.social, 30);
});

test("an empty epoch rolls every holder bucket forward instead of losing it", () => {
  const { unclaimed, payouts } = distributeEpoch(200, []);
  assert.equal(payouts.length, 0);
  assert.equal(unclaimed.callouts, 60);
  assert.equal(unclaimed.fomo, 60);
  assert.equal(unclaimed.social, 60);
});

test("distributed total never exceeds the revenue", () => {
  const { payouts, revenue } = distributeEpoch(1_000, [
    { wallet: "a", balance: 900_000, calloutScore: 4, socialScore: 200, xVerified: true },
    { wallet: "b", balance: 400_000, calloutScore: 2, socialScore: 100, xVerified: true },
    { wallet: "c", balance: 250_000, socialScore: 50, xVerified: true },
  ]);
  const paid = payouts.reduce((sum, p) => sum + p.total, 0);
  // 90% is distributable; the treasury 10% is not paid out to holders.
  assert.ok(paid <= revenue * 0.9 + 1e-9, `paid ${paid} exceeded 90% of ${revenue}`);
  assert.ok(paid > 0);
});

test("treasury burn budget adds fees, trading profit and callout rewards", () => {
  const budget = burnBudget(100, 25, 5);
  assert.equal(budget.seed, 10);
  assert.equal(budget.total, 40);
});
