import { PublicKey } from "@solana/web3.js";
import { MIN_ELIGIBLE, TOKEN } from "@/lib/config";
import { claimCallout } from "@/lib/callers";
import { fetchPost, isWallet, SeatError } from "@/lib/seats-core";
import { clientIp, fail, ok, rateLimited } from "@/lib/http";
import { ensureCoin } from "@/lib/registry";
import { getAttentionBalance } from "@/lib/solana";
import { requireStore } from "@/lib/store";

export const runtime = "nodejs";

/** POST { wallet, postUrl }: verify the 𝕏 callout via oEmbed, then seat (or renew) the wallet. */
export async function POST(req: Request) {
  if (rateLimited(`claim:${clientIp(req)}`, 10)) return ok({ error: "Slow down. Try again in a minute." }, { status: 429 });
  try {
    const { wallet, postUrl } = (await req.json()) as { wallet?: string; postUrl?: string };
    if (!wallet || !isWallet(wallet)) throw new SeatError("BAD_WALLET", "Enter a valid Solana wallet address");
    if (!PublicKey.isOnCurve(new PublicKey(wallet).toBytes())) throw new SeatError("BAD_WALLET", "That's a program account (pool, curve or vault). Use a normal wallet.");
    if (!postUrl) throw new SeatError("BAD_POST_URL", "Paste the link to your post (x.com/you/status/…)");
    const store = requireStore();

    // Network calls outside the write: balance (unknown = allowed, the sweep and
    // the payout snapshot re-check it) and the post itself.
    const [bal, post] = await Promise.all([getAttentionBalance(wallet), fetchPost(postUrl)]);
    if (bal.configured && bal.balance < MIN_ELIGIBLE) {
      throw new SeatError(
        "BAD_WALLET",
        `This wallet holds ${Math.floor(bal.balance).toLocaleString("en-US")} $${TOKEN.symbol}. Hold ${MIN_ELIGIBLE.toLocaleString("en-US")}+ to join the 𝕏 pool.`,
      );
    }
    await ensureCoin();
    const result = await store.updateCoin(TOKEN.mint, (coin) => claimCallout(coin, wallet, post));
    return ok({ ...result, handle: post.handle, balance: bal.configured ? bal.balance : null });
  } catch (err) {
    return fail(err);
  }
}
