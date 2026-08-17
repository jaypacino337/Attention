import { NextResponse } from "next/server";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { challengeMessage, verifyChallenge } from "@/lib/challenge";
import { createSession } from "@/lib/session";
import { isValidAddress } from "@/lib/solana";

export const runtime = "nodejs";

/**
 * Verify a wallet signature and open a session.
 *
 * The message is rebuilt server-side from the wallet and challenge rather than
 * trusting whatever text the client claims it signed — otherwise a caller
 * could sign some unrelated string and present it as a login.
 */
export async function POST(request: Request) {
  let body: { wallet?: unknown; challenge?: unknown; signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const { wallet, challenge, signature } = body;
  if (
    typeof wallet !== "string" ||
    typeof challenge !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing wallet, challenge or signature" }, { status: 400 });
  }
  if (!isValidAddress(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }
  if (!verifyChallenge(wallet, challenge)) {
    return NextResponse.json({ error: "Challenge expired — try again" }, { status: 401 });
  }

  let ok = false;
  try {
    ok = nacl.sign.detached.verify(
      new TextEncoder().encode(challengeMessage(wallet, challenge)),
      bs58.decode(signature),
      new PublicKey(wallet).toBytes(),
    );
  } catch {
    return NextResponse.json({ error: "Malformed signature" }, { status: 400 });
  }

  if (!ok) {
    return NextResponse.json({ error: "Signature did not verify" }, { status: 401 });
  }

  await createSession(wallet);
  return NextResponse.json({ ok: true, wallet });
}
