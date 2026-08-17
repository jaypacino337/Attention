/**
 * Single source of truth for ATTENTION tokenomics.
 *
 * Everything the site displays — fee splits, eligibility thresholds, gate
 * levels — reads from here, so changing the economics is a one-file edit and
 * the UI, the API routes and the reward math stay in agreement.
 */

/** Token identity. The mint is required for live balance checks. */
export const TOKEN = {
  symbol: "ATTENTION",
  name: "Attention Markets",
  /**
   * Set NEXT_PUBLIC_ATTENTION_MINT to the pump.fun mint address.
   * Until it is set the site runs in preview mode: everything renders, but
   * balance checks return `configured: false` instead of inventing a number.
   */
  mint: process.env.NEXT_PUBLIC_ATTENTION_MINT ?? "",
  /** pump.fun mints are 6 decimals. Overridable if the token migrates. */
  decimals: Number(process.env.NEXT_PUBLIC_ATTENTION_DECIMALS ?? 6),
} as const;

export const isMintConfigured = () => TOKEN.mint.trim().length > 0;

/**
 * Wallet connect is OFF by design: rewards are automatic airdrops to holders
 * found by the on-chain scan, so nobody has to connect anything — holding the
 * token is the registration. The full auth stack (challenge/verify/sessions)
 * stays in the codebase, dormant; set NEXT_PUBLIC_WALLET_CONNECT=true (plus
 * the mint) only if per-wallet features ever return.
 */
export const WALLET_ENABLED =
  isMintConfigured() && process.env.NEXT_PUBLIC_WALLET_CONNECT === "true";

/**
 * Where trading fees go. Must total 100.
 * Validated at module load so a bad edit fails loudly instead of silently
 * shipping a split that doesn't add up.
 */
export const FEE_SPLIT = [
  {
    id: "callouts",
    percent: 25,
    name: "Pump.fun",
    tagline: "Call out $ATTENTION.",
    detail:
      "Rewards the people calling out $ATTENTION on pump.fun. Weighted by what you hold and the callouts you make — paid out near-daily.",
    accent: "orange",
  },
  {
    id: "fomo",
    percent: 25,
    name: "FOMO",
    tagline: "Spread it through FOMO.",
    detail:
      "Rewards for pushing $ATTENTION through FOMO — the wallets carrying the momentum each epoch get the pool.",
    accent: "ink",
  },
  {
    id: "social",
    percent: 40,
    name: "X",
    tagline: "Create and maintain attention.",
    detail:
      "The biggest pool. Post $ATTENTION on X, keep it in the feed, and rewards route to the wallet behind the attention.",
    accent: "lime",
  },
  {
    id: "treasury",
    percent: 10,
    name: "Attention Fund",
    tagline: "Hunt where attention goes next.",
    detail:
      "Capitalizes the Attention Fund. It trades attention-driven opportunities and makes its own callouts — realized profits and callout rewards buy back and burn $ATTENTION.",
    accent: "orange",
  },
] as const;

export type FeeBucket = (typeof FEE_SPLIT)[number];
export type FeeBucketId = FeeBucket["id"];

const total = FEE_SPLIT.reduce((sum, b) => sum + b.percent, 0);
if (total !== 100) {
  throw new Error(`FEE_SPLIT must total 100%, got ${total}%`);
}

/**
 * Holder eligibility. `min` is a whole-token amount (not base units).
 *
 * ONE floor, deliberately: hold 250K $ATTENTION and you're in every reward
 * pool. No boosted tiers, no weight multipliers — simple to explain in a
 * post, simple to verify on-chain.
 */
export const TIERS = [
  {
    id: "none",
    name: "Unqualified",
    min: 0,
    weight: 0,
    perks: ["Public site access"],
  },
  {
    id: "base",
    name: "250K",
    min: 250_000,
    weight: 1,
    perks: [
      "Eligible for every reward pool",
      "Automatic airdrops — nothing to claim",
      "Counted in every epoch's holder scan",
    ],
  },
] as const;

export type Tier = (typeof TIERS)[number];
export type TierId = Tier["id"];

export const MIN_ELIGIBLE = 250_000;
/** Minimum balance required for terminal access, if gating is ever re-enabled. */
export const TERMINAL_GATE = MIN_ELIGIBLE;

/** Resolve a whole-token balance to its tier. */
export function tierFor(balance: number): Tier {
  let resolved: Tier = TIERS[0];
  for (const tier of TIERS) {
    if (balance >= tier.min) resolved = tier;
  }
  return resolved;
}

export function isEligible(balance: number): boolean {
  return balance >= MIN_ELIGIBLE;
}

/** Progress toward the next tier, for the dashboard meter. */
export function nextTier(balance: number): { tier: Tier; needed: number } | null {
  const upcoming = TIERS.find((t) => t.min > balance);
  if (!upcoming) return null;
  return { tier: upcoming, needed: upcoming.min - balance };
}

export const LINKS = {
  x: process.env.NEXT_PUBLIC_X_URL ?? "https://x.com",
  pumpfun: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? "",
  docs: "/#how",
} as const;
