import { TOKEN, isMintConfigured } from "./config";

/**
 * Live token stats from pump.fun's frontend API.
 *
 * This is an unofficial endpoint and may change or rate-limit, so every read
 * is wrapped: on any failure the site renders nothing rather than stale or
 * invented numbers. Cached for 60s via Next's fetch cache so a traffic spike
 * doesn't hammer pump.fun from our server.
 */

export type TokenStats = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  replies: number | null;
  /** True once the bonding curve completed and the token moved to a DEX. */
  graduated: boolean | null;
};

export async function getTokenStats(): Promise<TokenStats | null> {
  if (!isMintConfigured()) return null;

  try {
    // `next.revalidate` is Next's fetch-cache extension; typed loosely so the
    // plain-Node test build compiles too.
    const init: RequestInit & { next?: { revalidate: number } } = {
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    };
    const response = await fetch(`https://frontend-api.pump.fun/coins/${TOKEN.mint}`, init);
    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

    const marketCapUsd = num(data.usd_market_cap);
    return {
      marketCapUsd,
      // pump.fun tokens have a fixed 1B supply; derive price from market cap.
      priceUsd: marketCapUsd !== null ? marketCapUsd / 1_000_000_000 : null,
      replies: num(data.reply_count),
      graduated: typeof data.complete === "boolean" ? data.complete : null,
    };
  } catch {
    return null;
  }
}
