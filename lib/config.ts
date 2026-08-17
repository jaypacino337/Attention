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
 * Wallet connect / gating UI is shown only once the mint exists. Until then
 * the site is a pure landing page — no connect buttons, terminal shown as
 * "opens at launch". Setting NEXT_PUBLIC_ATTENTION_MINT flips all of it on
 * (it is build-inlined, so a redeploy is required).
 */
export const WALLET_ENABLED = isMintConfigured();

/**
 * Where trading fees go. Must total 100.
 * Validated at module load so a bad edit fails loudly instead of silently
 * shipping a split that doesn't add up.
 */
export const FEE_SPLIT = [
  {
    id: "callouts",
    percent: 30,
    name: "Pump.fun",
    tagline: "Call attention early.",
    detail:
      "Callout rewards for surfacing plays on pump.fun before the crowd. Rewards weight the call that landed, not the loudest account.",
    accent: "orange",
  },
  {
    id: "fomo",
    percent: 30,
    name: "FOMO",
    tagline: "Find attention early.",
    detail:
      "Callout rewards for finding attention through FOMO — paid to the wallets surfacing momentum in each epoch.",
    accent: "ink",
  },
  {
    id: "social",
    percent: 30,
    name: "X",
    tagline: "Create and maintain attention.",
    detail:
      "Paid on measured reach from linked X accounts. Your X is bound to your wallet so payouts land where the attention came from.",
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
 * Holding tiers. `min` is a whole-token amount (not base units).
 *
 * BASE is the floor for any reward and for terminal access; FULL unlocks the
 * boosted reward weight and the premium terminal panels.
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
      "Reward eligibility across every pool",
      "Attention Terminal access",
      "Scanner access",
      "Link X for attention rewards",
    ],
  },
  {
    id: "full",
    name: "500K",
    min: 500_000,
    weight: 2,
    perks: [
      "Everything at 250K",
      "2x reward weight across every pool",
      "Advanced Terminal panels",
      "Scanner calls as they fire",
    ],
  },
] as const;

export type Tier = (typeof TIERS)[number];
export type TierId = Tier["id"];

export const MIN_ELIGIBLE = 250_000;
export const FULL_TIER = 500_000;
/** Minimum balance required to open the Attention Terminal. */
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
