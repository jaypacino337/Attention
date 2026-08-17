import { NextResponse } from "next/server";
import { MIN_ELIGIBLE } from "@/lib/config";
import { scanHolders } from "@/lib/holders";
import { distributeEpoch } from "@/lib/rewards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** A full holder scan can take a while on a big holder set. */
export const maxDuration = 60;

/**
 * Admin payout sheet for one epoch.
 *
 *   GET /api/epoch?revenue=12.5
 *   header: x-admin-key: $ADMIN_KEY
 *
 * Scans every holder above the eligibility floor live from chain and returns
 * the daily/FOMO distribution for the given fee revenue (in SOL), ready to
 * pay from. The callout and social pools are returned as unclaimed here —
 * those scores come from human judgement and X metrics, which this endpoint
 * does not have; add per-wallet scores to the sheet before paying them.
 *
 * Keyed because a holder scan is an expensive RPC call — this must not be a
 * public, spammable route. It never touches private keys; paying remains a
 * deliberate manual act (or a separate job with its own key management).
 */
export async function GET(request: Request) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || adminKey.length < 16) {
    return NextResponse.json(
      { error: "ADMIN_KEY (16+ chars) is not configured on the server" },
      { status: 503 },
    );
  }
  if (request.headers.get("x-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const revenue = Number(url.searchParams.get("revenue"));
  if (!Number.isFinite(revenue) || revenue < 0) {
    return NextResponse.json(
      { error: "Pass ?revenue=<epoch fees in SOL>, e.g. /api/epoch?revenue=12.5" },
      { status: 400 },
    );
  }

  let holders;
  try {
    holders = await scanHolders(MIN_ELIGIBLE);
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Holder scan failed" },
      { status: 502 },
    );
  }

  const distribution = distributeEpoch(
    revenue,
    holders.map((holder) => ({ wallet: holder.owner, balance: holder.balance })),
  );

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    eligibleHolders: holders.length,
    // Raw balances so the operator's payout tooling can apply time-based
    // rules (sell penalties, holding streaks) that need history the
    // stateless server doesn't keep.
    holders: holders.map((holder) => ({ wallet: holder.owner, balance: holder.balance })),
    note: "fomo amounts are payable as-is; callout/social pools are unclaimed until scores are assigned",
    ...distribution,
  });
}
