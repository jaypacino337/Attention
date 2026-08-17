import assert from "node:assert/strict";
import { test } from "node:test";
import { attentionScore, DEFAULT_WEIGHTS } from "../lib/attention-score";

test("attention score is null with no inputs — never invented", () => {
  assert.equal(attentionScore({}), null);
});

test("attention score renormalizes over present inputs", () => {
  // Only one signal present: score equals that signal, regardless of weight.
  assert.equal(attentionScore({ socialVelocity: 80 }), 80);
});

test("attention score clamps out-of-range inputs", () => {
  assert.equal(attentionScore({ socialVelocity: 250 }), 100);
  assert.equal(attentionScore({ socialVelocity: -50 }), 0);
});

test("attention score blends by weight", () => {
  const score = attentionScore({ socialVelocity: 100, calloutActivity: 0 });
  // 100*0.3 / (0.3+0.2) = 60
  assert.equal(score, 60);
});

test("default weights cover all signals and sum to 1", () => {
  const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
});
