/**
 * Single source of truth for $ATTENTION economics and identity.
 *
 * Everything the site displays (fee split, eligibility, 𝕏-pool rules) and the
 * payout worker config documented in deploy/RAILWAY.md read from the same
 * numbers, so changing the economics is a one-file edit plus a worker
 * variable change. The split is asserted to total 100 at module load.
 */

/** Token identity. The launched pump.fun mint (Token-2022); env can override if it ever migrates. */
export const TOKEN = {
  symbol: "ATTENTION",
  name: "Attention Markets",
  mint: process.env.NEXT_PUBLIC_ATTENTION_MINT || "CSL5S49M4RBJZuvm289x4Mt7AtSsprWmZe7ne3Xppump",
  /** pump.fun mints are 6 decimals. */
  decimals: Number(process.env.NEXT_PUBLIC_ATTENTION_DECIMALS ?? 6),
  supply: 1_000_000_000,
} as const;

export const isMintConfigured = () => TOKEN.mint.trim().length > 0;

/** One floor for every pool: hold this many whole $ATTENTION. */
export const MIN_ELIGIBLE = 250_000;

export function isEligible(balance: number): boolean {
  return balance >= MIN_ELIGIBLE;
}

/**
 * Where creator fees go, every cycle. Must total 100.
 * `route` is the matching memcoinz flywheel bucket (deploy/RAILWAY.md).
 */
export const FEE_SPLIT = [
  {
    id: "holders",
    percent: 50,
    name: "Holders",
    route: "airdrop",
    tagline: "Hold it. Get paid.",
    detail: `Every wallet holding ${MIN_ELIGIBLE.toLocaleString("en-US")}+ $ATTENTION, pro-rata to balance, max 4% of the pot per wallet.`,
  },
  {
    id: "x",
    percent: 40,
    name: "𝕏 Callers",
    route: "treasury → 𝕏 pool wallet",
    tagline: "Call it. Get paid.",
    detail: "Split equally between every holder with a live, verified $ATTENTION callout on 𝕏. One account, one share.",
  },
  {
    id: "fund",
    percent: 10,
    name: "Buyback & burn",
    route: "buyback",
    tagline: "Less supply. Every cycle.",
    detail: "Market-buys $ATTENTION and burns it on-chain, every cycle.",
  },
] as const;

export type FeeBucket = (typeof FEE_SPLIT)[number];
export type FeeBucketId = FeeBucket["id"];

const total = FEE_SPLIT.reduce((sum, b) => sum + b.percent, 0);
if (total !== 100) {
  throw new Error(`FEE_SPLIT must total 100%, got ${total}%`);
}

/** Holder pool settings, mirrored in the flywheel worker's MEMCOIN_CONFIG_JSON. */
export const HOLDER_POOL = {
  mode: "prorata" as const,
  capBps: 400,
  intervalMinutes: 60,
};

/**
 * 𝕏 callout pool. A "seat" = a wallet whose 𝕏 callout was verified (free
 * oEmbed read, wallet-bound code). Seats last `windowDays` from the post's
 * timestamp; posting a fresh callout renews it. The pool is split equally
 * between live seats that still hold MIN_ELIGIBLE.
 */
export const X_POOL = {
  /** The 𝕏 account every callout must @mention (no @). */
  handle: process.env.NEXT_PUBLIC_X_HANDLE || "Attn_Markets_",
  windowDays: 7,
  mode: "equal" as const,
  /** Cron for the 𝕏-pool payout service (UTC): every 6 hours. */
  cron: "0 */6 * * *",
  /** Seats are uncapped: every verified caller gets one. */
  seatCap: 100_000,
};

export const X_WINDOW_MS = X_POOL.windowDays * 86_400_000;

/** Public site URL (the worker's `seats.url`). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://attnmarkets.fun";

export const LINKS = {
  x: process.env.NEXT_PUBLIC_X_URL || `https://x.com/${X_POOL.handle}`,
  pumpfun: process.env.NEXT_PUBLIC_PUMPFUN_URL || `https://pump.fun/coin/${TOKEN.mint}`,
  solscan: `https://solscan.io/token/${TOKEN.mint}`,
} as const;
