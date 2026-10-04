import { FEE_SPLIT, type FeeBucketId } from "./config";

/**
 * Display math for the fee split. The SENDING math lives in memcoinz
 * (flywheel splitRoute + airdrop allocate, integer lamports, round down);
 * these mirror it so the numbers on the site match what the worker pays.
 */

/** SOL per bucket for `revenue` SOL of claimed fees (same rounding as memcoinz splitRoute). */
export function bucketAmounts(revenue: number): Record<FeeBucketId, number> {
  const lamports = BigInt(Math.round(revenue * 1e9));
  const out = {} as Record<FeeBucketId, number>;
  for (const b of FEE_SPLIT) out[b.id] = Number((lamports * BigInt(b.percent * 100)) / 10_000n) / 1e9;
  return out;
}

/** Each live 𝕏 caller's equal share of an 𝕏-pool pot (memcoinz airdrop mode "equal"). */
export function xShare(pot: number, liveCallers: number): number {
  if (liveCallers <= 0 || pot <= 0) return 0;
  const lamports = BigInt(Math.round(pot * 1e9));
  return Number(lamports / BigInt(liveCallers)) / 1e9;
}
