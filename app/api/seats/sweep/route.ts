import { TOKEN } from "@/lib/config";
import { sweepCallers } from "@/lib/callers";
import { ataBalances, connection } from "@/lib/chain";
import { seatLabel } from "@/lib/seats-core";
import { fail, ok } from "@/lib/http";
import { requireStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;
const COOLDOWN_MS = 60_000;

/**
 * POST { mint }: "sell it, lose it" + lapse. Permissionless with a 60s cooldown
 * (memcoinz seats contract). Frees seats whose wallet holds < 250K (read from
 * chain here; a failed read never frees a seat) and seats whose callout is
 * older than the window.
 */
export async function POST(req: Request) {
  try {
    const { mint } = (await req.json().catch(() => ({}))) as { mint?: string };
    if ((mint ?? TOKEN.mint) !== TOKEN.mint) return ok({ error: "Unknown coin" }, { status: 404 });
    const store = requireStore();
    const coin = await store.getCoin(TOKEN.mint);
    if (!coin) return ok({ freed: [], promoted: [], lapsed: [], checked: 0 });
    const wait = coin.lastSweepAt + COOLDOWN_MS - Date.now();
    if (wait > 0) return ok({ skipped: true, retryInMs: wait });

    const balances = await ataBalances(connection(), coin.mint, coin.seats.map((s) => s.wallet));
    const res = await store.updateCoin(coin.mint, (c) => sweepCallers(c, balances));
    const fmt = (s: { wallet: string; x: string; index: number }) => ({ wallet: s.wallet, x: s.x, label: seatLabel(s.index) });
    return ok({
      lapsed: res.lapsed.map(fmt),
      freed: res.freed.map((s) => ({ ...fmt(s), balance: balances.get(s.wallet) })),
      promoted: res.promoted.map(fmt),
      checked: balances.size,
    });
  } catch (err) {
    return fail(err);
  }
}
