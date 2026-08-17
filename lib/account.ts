import {
  MIN_ELIGIBLE,
  TERMINAL_GATE,
  type Tier,
  isEligible,
  nextTier,
  tierFor,
} from "./config";
import { getSessionWallet } from "./session";
import { getAttentionBalance } from "./solana";
import { getLink, type XLink } from "./store";

/**
 * The account snapshot shared by the API and the server components.
 *
 * Balance is read live on every call rather than cached in the session, so
 * gate decisions always reflect what the wallet holds right now.
 */
export type Account = {
  wallet: string;
  balance: number;
  /** False when no mint is configured — the UI shows "preview" instead of 0. */
  balanceKnown: boolean;
  tier: Tier;
  eligible: boolean;
  canOpenTerminal: boolean;
  toNextTier: { tier: Tier; needed: number } | null;
  xLink: XLink | null;
  thresholds: { eligible: number; terminal: number };
};

export async function loadAccount(): Promise<Account | null> {
  const wallet = await getSessionWallet();
  if (!wallet) return null;

  const [result, xLink] = await Promise.all([getAttentionBalance(wallet), getLink(wallet)]);
  const balance = result.balance;
  const balanceKnown = result.configured;

  return {
    wallet,
    balance,
    balanceKnown,
    tier: tierFor(balance),
    eligible: balanceKnown && isEligible(balance),
    canOpenTerminal: balanceKnown && balance >= TERMINAL_GATE,
    toNextTier: nextTier(balance),
    xLink,
    thresholds: { eligible: MIN_ELIGIBLE, terminal: TERMINAL_GATE },
  };
}
