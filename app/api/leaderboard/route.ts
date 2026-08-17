import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** The heavy scan can take a while on large holder sets. */
export const maxDuration = 60;

/**
 * Public holder leaderboard — wallet addresses and balances are public
 * blockchain data. Cached for an hour behind unstable_cache; hitting this
 * route (or any page that renders the leaderboard) after expiry refreshes it.
 */
export async function GET() {
  const leaderboard = await getLeaderboard();
  if (!leaderboard) {
    return NextResponse.json(
      { available: false, reason: "Requires NEXT_PUBLIC_ATTENTION_MINT and a dedicated SOLANA_RPC_URL" },
      { status: 200 },
    );
  }
  return NextResponse.json({ available: true, leaderboard });
}
