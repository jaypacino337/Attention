import { TOKEN } from "@/lib/config";
import { phraseFor } from "@/lib/callers";
import { isWallet } from "@/lib/seats-core";
import { ok } from "@/lib/http";
import { readCallers } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/seats?mint=<MINT>[&wallet=…]: the live 𝕏 caller list.
 * Same contract as memcoinz seats sites, so the shared worker's
 * `seats.url` (snapshot --seats) reads `seats[].wallet` from here.
 * Storage down → 503, so a payout run refuses instead of paying an empty list.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mint = url.searchParams.get("mint") ?? TOKEN.mint;
  const wallet = url.searchParams.get("wallet");
  if (mint !== TOKEN.mint) return ok({ error: "Unknown coin" }, { status: 404 });
  const { view, storage } = await readCallers();
  if (storage === "unconfigured" || storage === "error") return ok({ error: "Caller registry unavailable", storage }, { status: 503 });
  return ok({ ...view, storage, ...(wallet && isWallet(wallet) ? { phrase: phraseFor(mint, wallet) } : {}) });
}
