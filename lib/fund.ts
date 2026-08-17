import fs from "node:fs/promises";
import path from "node:path";

/**
 * Attention Fund — transparent dashboard data.
 *
 * Everything here is REAL, curated data committed to data/fund.json; the
 * dashboard renders exactly what exists and an empty state for what doesn't.
 * No field is required, nothing is estimated, and the fund is never presented
 * as always winning — realized PnL is shown signed, losses included.
 *
 * Transactions carry explorer links (txUrl) so every number is checkable.
 */

export type FundStats = {
  fundValueSol?: number;
  realizedPnlSol?: number;
  calloutRewardsSol?: number;
  attentionBoughtBack?: number;
  attentionBurned?: number;
};

export type FundPosition = {
  asset: string;
  ticker?: string;
  sizeSol?: number;
  entryMcap?: number;
  currentMcap?: number;
  openedAt?: string;
  txUrl?: string;
};

export type FundTrade = {
  asset: string;
  ticker?: string;
  pnlSol?: number;
  closedAt?: string;
  txUrl?: string;
};

export type FundCallout = {
  asset: string;
  platform?: string;
  url?: string;
  rewardSol?: number;
  at?: string;
};

export type FundBuyback = {
  amountAttention?: number;
  solSpent?: number;
  at?: string;
  txUrl?: string;
};

export type FundBurn = {
  amountAttention?: number;
  at?: string;
  txUrl?: string;
};

export type FundSnapshot = {
  updatedAt?: string;
  stats: FundStats;
  openPositions: FundPosition[];
  closedTrades: FundTrade[];
  callouts: FundCallout[];
  buybacks: FundBuyback[];
  burns: FundBurn[];
};

const EMPTY: FundSnapshot = {
  stats: {},
  openPositions: [],
  closedTrades: [],
  callouts: [],
  buybacks: [],
  burns: [],
};

const arr = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** The fund snapshot; every list empty and stats {} when no data exists yet. */
export async function loadFund(): Promise<FundSnapshot> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "fund.json"), "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined,
      stats:
        typeof parsed.stats === "object" && parsed.stats !== null
          ? (parsed.stats as FundStats)
          : {},
      openPositions: arr<FundPosition>(parsed.openPositions),
      closedTrades: arr<FundTrade>(parsed.closedTrades),
      callouts: arr<FundCallout>(parsed.callouts),
      buybacks: arr<FundBuyback>(parsed.buybacks),
      burns: arr<FundBurn>(parsed.burns),
    };
  } catch {
    return EMPTY;
  }
}

export function fundHasData(snapshot: FundSnapshot): boolean {
  return (
    Object.values(snapshot.stats).some((v) => typeof v === "number") ||
    snapshot.openPositions.length > 0 ||
    snapshot.closedTrades.length > 0 ||
    snapshot.callouts.length > 0 ||
    snapshot.buybacks.length > 0 ||
    snapshot.burns.length > 0
  );
}
