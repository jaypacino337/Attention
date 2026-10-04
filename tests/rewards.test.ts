import assert from "node:assert/strict";
import { test } from "node:test";
import { FEE_SPLIT, MIN_ELIGIBLE, isEligible } from "../lib/config";
import { bucketAmounts, xShare } from "../lib/rewards";

test("fee split totals 100% and maps to memcoinz route buckets", () => {
  assert.equal(FEE_SPLIT.reduce((s, b) => s + b.percent, 0), 100);
  assert.deepEqual(FEE_SPLIT.map((b) => [b.id, b.percent]), [["holders", 50], ["x", 40], ["fund", 10]]);
});

test("bucket amounts follow the 50/40/10 split and never exceed revenue", () => {
  assert.deepEqual(bucketAmounts(1), { holders: 0.5, x: 0.4, fund: 0.1 });
  const odd = bucketAmounts(0.000000007);
  assert.ok(odd.holders + odd.x + odd.fund <= 0.000000007);
});

test("250K floor", () => {
  assert.equal(MIN_ELIGIBLE, 250_000);
  assert.ok(!isEligible(249_999));
  assert.ok(isEligible(250_000));
});

test("𝕏 pool shares are equal and round down", () => {
  assert.equal(xShare(1, 4), 0.25);
  assert.equal(xShare(1, 3), 0.333333333);
  assert.equal(xShare(1, 0), 0);
});
