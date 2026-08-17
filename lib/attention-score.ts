/**
 * Attention Score — deliberately modular.
 *
 * The score is a weighted blend of named signal inputs. The exact formula is
 * NOT fixed product surface: inputs and weights are data, so they can change
 * as real Pump.fun / FOMO / X integrations land, without touching any UI.
 *
 * Every input is expected on a 0–100 scale. A score is only produced from
 * inputs that are actually present — if nothing is known, the result is null
 * and the UI must render an empty state, never an invented number.
 */

export const SCORE_SIGNALS = [
  "socialVelocity",
  "calloutActivity",
  "priceMomentum",
  "volume",
  "xActivity",
] as const;

export type ScoreSignal = (typeof SCORE_SIGNALS)[number];
export type ScoreInputs = Partial<Record<ScoreSignal, number>>;
export type ScoreWeights = Record<ScoreSignal, number>;

/** Starting weights — tune freely; the blend renormalizes over present inputs. */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  socialVelocity: 0.3,
  calloutActivity: 0.2,
  priceMomentum: 0.2,
  volume: 0.15,
  xActivity: 0.15,
};

export function attentionScore(
  inputs: ScoreInputs,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): number | null {
  let weighted = 0;
  let weightSum = 0;
  for (const signal of SCORE_SIGNALS) {
    const value = inputs[signal];
    if (typeof value === "number" && Number.isFinite(value)) {
      const clamped = Math.max(0, Math.min(100, value));
      weighted += clamped * weights[signal];
      weightSum += weights[signal];
    }
  }
  if (weightSum === 0) return null;
  return Math.round(weighted / weightSum);
}
