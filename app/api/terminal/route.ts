import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/account";
import { getTerminalFeed } from "@/lib/terminal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Token-gated terminal feed.
 *
 * The gate is enforced here, server-side, on a live balance read. The page
 * also gates its own render, but that alone would be decoration — anyone can
 * call the API directly, so this is where access is actually decided.
 */
export async function GET() {
  const account = await loadAccount();
  if (!account) {
    return NextResponse.json({ error: "Connect your wallet first" }, { status: 401 });
  }

  if (!account.canOpenTerminal) {
    return NextResponse.json(
      {
        error: "Terminal locked",
        required: account.thresholds.terminal,
        balance: account.balance,
      },
      { status: 403 },
    );
  }

  const feed = await getTerminalFeed();
  return NextResponse.json({ feed, tier: account.tier.id });
}
