import { unstable_cache } from "next/cache";
import { MIN_ELIGIBLE, isMintConfigured, tierFor } from "./config";
import { scanHolders } from "./holders";
import { shortAddress } from "./solana";

/**
 * On-chain holder leaderboard — fully automatic once the mint and a dedicated
 * RPC are configured.
 *
 * The scan walks every token account for the mint, which is too heavy to run
 * per request; unstable_cache holds the result for an hour and the first
 * visitor after expiry refreshes it. No cron needed, no storage needed, and
 * on failure the cached value is simply null — callers fall back rather than
 * showing invented holders.
 */

export type LeaderboardEntry = {
  owner: string;
  display: string;
  balance: number;
  tier: string;
};

export type Leaderboard = {
  updatedAt: string;
  totalHolders: number;
  eligibleHolders: number;
  top: LeaderboardEntry[];
};

const REFRESH_SECONDS = 3600;

async function build(): Promise<Leaderboard | null> {
  if (!isMintConfigured()) return null;
  try {
    const holders = await scanHolders(0);
    return {
      updatedAt: new Date().toISOString(),
      totalHolders: holders.length,
      eligibleHolders: holders.filter((h) => h.balance >= MIN_ELIGIBLE).length,
      top: holders.slice(0, 50).map((holder) => ({
        owner: holder.owner,
        display: shortAddress(holder.owner),
        balance: Math.round(holder.balance),
        tier: tierFor(holder.balance).name,
      })),
    };
  } catch {
    // Bad RPC config or a transient failure — callers show their fallback.
    return null;
  }
}

export const getLeaderboard = unstable_cache(build, ["holder-leaderboard"], {
  revalidate: REFRESH_SECONDS,
});
