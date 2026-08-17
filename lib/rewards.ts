import { FEE_SPLIT, type FeeBucketId, MIN_ELIGIBLE, tierFor } from "./config";

/**
 * Reward math for a fee epoch.
 *
 * Kept pure and free of I/O so the numbers the site shows and the numbers a
 * payout job would send come from the same function — the split can be
 * audited and unit-tested without touching an RPC.
 */

export type Participant = {
  wallet: string;
  /** Whole ATTENTION held at snapshot time. */
  balance: number;
  /** Score for the callout pool — landed calls, weighted by how early. */
  calloutScore?: number;
  /** Score for the social pool — measured reach on the linked X account. */
  socialScore?: number;
  /** Whether the wallet has a verified X link. Unverified earns no social. */
  xVerified?: boolean;
};

export type Payout = {
  wallet: string;
  amounts: Record<FeeBucketId, number>;
  total: number;
};

export type EpochDistribution = {
  /** Total fees for the epoch, in SOL. */
  revenue: number;
  buckets: Record<FeeBucketId, number>;
  payouts: Payout[];
  /** Bucket funds with no eligible claimant, rolled into the next epoch. */
  unclaimed: Record<FeeBucketId, number>;
};

export function bucketAmounts(revenue: number): Record<FeeBucketId, number> {
  const out = {} as Record<FeeBucketId, number>;
  for (const bucket of FEE_SPLIT) {
    out[bucket.id] = (revenue * bucket.percent) / 100;
  }
  return out;
}

/**
 * Share out one pool proportionally to each wallet's score.
 *
 * Returns the paid map plus whatever could not be allocated, so the caller can
 * roll it forward rather than quietly losing it.
 */
function shareOut(
  pool: number,
  scores: Map<string, number>,
): { paid: Map<string, number>; leftover: number } {
  const totalScore = [...scores.values()].reduce((sum, s) => sum + s, 0);
  if (totalScore <= 0) return { paid: new Map(), leftover: pool };

  const paid = new Map<string, number>();
  for (const [wallet, score] of scores) {
    if (score > 0) paid.set(wallet, (pool * score) / totalScore);
  }
  return { paid, leftover: 0 };
}

/**
 * Distribute one epoch of fees across the four buckets.
 *
 * Eligibility rules applied here:
 *  - below MIN_ELIGIBLE earns nothing from any holder pool;
 *  - tier weight multiplies every holder-pool score (single tier: weight 1);
 *  - the social pool pays only wallets with a *verified* X link;
 *  - the treasury bucket is not distributed — it funds the wallet/scanner and
 *    its profits come back as buy-and-burn.
 */
export function distributeEpoch(
  revenue: number,
  participants: Participant[],
): EpochDistribution {
  const buckets = bucketAmounts(revenue);
  const eligible = participants.filter((p) => p.balance >= MIN_ELIGIBLE);

  const calloutScores = new Map<string, number>();
  const fomoScores = new Map<string, number>();
  const socialScores = new Map<string, number>();

  for (const p of eligible) {
    const weight = tierFor(p.balance).weight;
    if (p.calloutScore) calloutScores.set(p.wallet, p.calloutScore * weight);
    // The daily/FOMO pot is shared by holding size, scaled by tier weight.
    fomoScores.set(p.wallet, p.balance * weight);
    if (p.xVerified && p.socialScore) {
      socialScores.set(p.wallet, p.socialScore * weight);
    }
  }

  const callouts = shareOut(buckets.callouts, calloutScores);
  const fomo = shareOut(buckets.fomo, fomoScores);
  const social = shareOut(buckets.social, socialScores);

  const wallets = new Set([
    ...callouts.paid.keys(),
    ...fomo.paid.keys(),
    ...social.paid.keys(),
  ]);

  const payouts: Payout[] = [...wallets]
    .map((wallet) => {
      const amounts = {
        callouts: callouts.paid.get(wallet) ?? 0,
        fomo: fomo.paid.get(wallet) ?? 0,
        social: social.paid.get(wallet) ?? 0,
        treasury: 0,
      } satisfies Record<FeeBucketId, number>;
      const total = amounts.callouts + amounts.fomo + amounts.social;
      return { wallet, amounts, total };
    })
    .sort((a, b) => b.total - a.total);

  return {
    revenue,
    buckets,
    payouts,
    unclaimed: {
      callouts: callouts.leftover,
      fomo: fomo.leftover,
      social: social.leftover,
      treasury: 0,
    },
  };
}

/** What the treasury bucket sends to buy-and-burn: its fees plus trading profit. */
export function burnBudget(revenue: number, tradingProfit: number, calloutRewards: number) {
  const seed = bucketAmounts(revenue).treasury;
  return { seed, tradingProfit, calloutRewards, total: seed + tradingProfit + calloutRewards };
}
