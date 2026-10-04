/**
 * The 𝕏 callout pool, built on memcoinz seats (lib/seats-core.ts).
 *
 * Rules (also published on /rules, keep them in sync):
 *  1. Your callout must include `@<handle> $ATTENTION give me a seat · <code>`.
 *     The 8-char code is sha256(mint, wallet), so a post only links the wallet
 *     it was generated for. Verified free through 𝕏 oEmbed: no API key, no OAuth.
 *  2. One 𝕏 account per wallet, one wallet per 𝕏 account, each post counts once.
 *  3. A seat lasts X_POOL.windowDays from the post's own timestamp. Post a fresh
 *     callout (same wallet, same account) any time to renew it.
 *  4. Seats are only paid while the wallet holds MIN_ELIGIBLE (the payout
 *     snapshot filters by balance; the sweep frees seats that sold).
 *  5. The pool is split equally between live seats: one account, one share.
 */
import { MIN_ELIGIBLE, X_POOL, X_WINDOW_MS } from "./config";
import {
  type ClaimResult,
  type Seat,
  type SeatCoin,
  type VerifiedPost,
  SeatError,
  claimCode,
  claimWithPost,
  newCoin,
  postMatches,
  postTime,
  publicView,
  seatLabel,
  seatPhrase,
  sweep,
} from "./seats-core";

export const TICKER = "ATTENTION";

/** The registry row for $ATTENTION. No creator seat: the creator is paid by the flywheel, not the 𝕏 pool. */
export function newAttentionCoin(mint: string): SeatCoin {
  // createdAt 0: seats-core rejects posts older than the coin row, but the row
  // is created lazily; our own freshness rule (rule 3) is the real limit.
  const coin = newCoin(
    { mint, creator: "", name: "Attention Markets", symbol: TICKER, image: null, seatCap: X_POOL.seatCap, minHold: MIN_ELIGIBLE },
    0,
  );
  coin.seats = [];
  return coin;
}

export const phraseFor = (mint: string, wallet: string) => seatPhrase(X_POOL.handle, TICKER, claimCode(mint, wallet));

/** When a seat lapses: its post time + the window. Seats without a post never lapse (none exist on Attention). */
export const seatExpiresAt = (seat: Pick<Seat, "postId" | "at">) =>
  seat.postId ? postTime(seat.postId) + X_WINDOW_MS : Number.POSITIVE_INFINITY;

const isLive = (seat: Seat, now: number) => seatExpiresAt(seat) > now;

/** Frees lapsed seats (mutates). Their posts stay in usedPosts, so a fresh post is needed. */
export function expire(coin: SeatCoin, now = Date.now()): Seat[] {
  const lapsed = coin.seats.filter((s) => !isLive(s, now));
  if (lapsed.length) {
    coin.seats = coin.seats.filter((s) => isLive(s, now));
    coin.freedTotal += lapsed.length;
  }
  return lapsed;
}

export type CalloutResult =
  | (Extract<ClaimResult, { status: "seated" }> & { expiresAt: number })
  | Extract<ClaimResult, { status: "waitlisted" }>
  | { status: "renewed"; seat: Seat; label: string; expiresAt: number };

/** Seat or renew `wallet` with an already-fetched post. Throws SeatError on any rule violation. */
export function claimCallout(coin: SeatCoin, wallet: string, post: VerifiedPost, now = Date.now()): CalloutResult {
  expire(coin, now);
  if (post.postedAt < now - X_WINDOW_MS) {
    throw new SeatError("POST_TOO_OLD", `That post is older than ${X_POOL.windowDays} days. Post a fresh callout.`);
  }

  const mine = coin.seats.find((s) => s.wallet === wallet);
  if (mine && mine.x === post.handle) {
    // Renewal: same wallet, same account, a newer callout.
    if (!postMatches(post.text, X_POOL.handle, coin.symbol, claimCode(coin.mint, wallet))) {
      throw new SeatError("WRONG_PHRASE", `Your post must say exactly: ${phraseFor(coin.mint, wallet)}`);
    }
    if (coin.usedPosts.includes(post.id)) throw new SeatError("POST_USED", "That post was already used. Post a fresh callout to renew.");
    if (mine.postId && postTime(mine.postId) >= post.postedAt) {
      throw new SeatError("POST_USED", "Your seat already runs off a newer post.");
    }
    coin.usedPosts.push(post.id);
    mine.postId = post.id;
    mine.at = now;
    return { status: "renewed", seat: mine, label: seatLabel(mine.index), expiresAt: seatExpiresAt(mine) };
  }

  const res = claimWithPost(coin, wallet, post, X_POOL.handle, now);
  return res.status === "seated" ? { ...res, expiresAt: seatExpiresAt(res.seat) } : res;
}

/** "Sell it, lose it" plus lapse: what /api/seats/sweep and the worker run. */
export function sweepCallers(coin: SeatCoin, balances: Map<string, number>, now = Date.now()) {
  const lapsed = expire(coin, now);
  const { freed, promoted } = sweep(coin, balances, now);
  return { lapsed, freed, promoted };
}

/** Public view (what GET /api/seats returns). Lapsed seats are hidden even before a write persists it. */
export function callersView(coin: SeatCoin, now = Date.now()) {
  const live: SeatCoin = { ...coin, seats: coin.seats.filter((s) => isLive(s, now)) };
  const view = publicView(live, now);
  const byWallet = new Map(live.seats.map((s) => [s.wallet, s]));
  return {
    ...view,
    handle: X_POOL.handle,
    windowDays: X_POOL.windowDays,
    seats: view.seats.map((s) => {
      const seat = byWallet.get(s.wallet)!;
      return { ...s, postId: seat.postId, expiresAt: seatExpiresAt(seat) };
    }),
  };
}

export type CallersView = ReturnType<typeof callersView>;
