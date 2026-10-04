import { PublicKey } from "@solana/web3.js";
import { MIN_ELIGIBLE, TOKEN } from "@/lib/config";
import { phraseFor } from "@/lib/callers";
import { isWallet } from "@/lib/seats-core";
import { clientIp, ok, rateLimited } from "@/lib/http";
import { readCallers } from "@/lib/registry";
import { getAttentionBalance } from "@/lib/solana";

export const dynamic = "force-dynamic";

/** GET /api/eligibility?wallet=…: both pools for one wallet. Read-only, nothing to sign or claim. */
export async function GET(req: Request) {
  if (rateLimited(`elig:${clientIp(req)}`, 30)) return ok({ error: "Slow down. Try again in a minute." }, { status: 429 });
  const wallet = new URL(req.url).searchParams.get("wallet")?.trim() ?? "";
  if (!isWallet(wallet)) return ok({ error: "Enter a valid Solana wallet address" }, { status: 400 });
  const [bal, { view }] = await Promise.all([getAttentionBalance(wallet), readCallers()]);
  const seat = view.seats.find((s) => s.wallet === wallet) ?? null;
  // Program-owned accounts (pools, the bonding curve, vaults) are excluded from payouts, like memcoinz snapshot.
  const program = !PublicKey.isOnCurve(new PublicKey(wallet).toBytes());
  const holds = program ? false : bal.configured ? bal.balance >= MIN_ELIGIBLE : null;
  return ok({
    wallet,
    balance: bal.configured ? bal.balance : null,
    min: MIN_ELIGIBLE,
    holderPool: holds,
    program,
    xPool: seat ? { handle: seat.x, label: seat.label, expiresAt: seat.expiresAt, paid: holds } : null,
    phrase: phraseFor(TOKEN.mint, wallet),
  });
}
