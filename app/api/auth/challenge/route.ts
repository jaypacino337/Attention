import { NextResponse } from "next/server";
import { challengeMessage, issueChallenge } from "@/lib/challenge";
import { isValidAddress } from "@/lib/solana";

export const runtime = "nodejs";

/** Hand the browser a challenge for this wallet to sign. */
export async function POST(request: Request) {
  let wallet: unknown;
  try {
    ({ wallet } = await request.json());
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  if (typeof wallet !== "string" || !isValidAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const challenge = issueChallenge(wallet);
  return NextResponse.json({ challenge, message: challengeMessage(wallet, challenge) });
}
