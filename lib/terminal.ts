/**
 * Attention Terminal feed.
 *
 * The shapes below are the contract the terminal UI renders against. The
 * current implementation returns SAMPLE data, clearly flagged as such by
 * `source: "sample"` — the site would rather show a labelled placeholder than
 * present invented numbers as live market intelligence.
 *
 * To go live, replace the body of `getTerminalFeed` with real reads (Helius /
 * Birdeye / Dune for flow and holders, an X listener for social velocity) and
 * return `source: "live"`. Nothing in the UI needs to change.
 */

export type TopWallet = {
  address: string;
  label: string;
  pnl7d: number;
  winRate: number;
  callouts: number;
};

export type TopCaller = {
  handle: string;
  wallet: string;
  landed: number;
  avgMultiple: number;
  reach: number;
};

export type MetaRow = {
  meta: string;
  chain: string;
  share: number;
  change24h: number;
};

export type ChainFlow = { chain: string; share: number; net24h: number };

export type TerminalFeed = {
  source: "sample" | "live";
  updatedAt: string;
  topWallets: TopWallet[];
  topCallers: TopCaller[];
  meta: MetaRow[];
  chains: ChainFlow[];
};

const SAMPLE: Omit<TerminalFeed, "updatedAt" | "source"> = {
  topWallets: [
    { address: "7Xk9…q2Rm", label: "scanner", pnl7d: 412.6, winRate: 0.71, callouts: 34 },
    { address: "9fTa…LmZ4", label: "early", pnl7d: 288.1, winRate: 0.64, callouts: 21 },
    { address: "Bq3n…Wd8s", label: "rotator", pnl7d: 173.9, winRate: 0.58, callouts: 17 },
    { address: "Hn5v…Tc1p", label: "sniper", pnl7d: 96.4, winRate: 0.53, callouts: 12 },
  ],
  topCallers: [
    { handle: "caller_one", wallet: "7Xk9…q2Rm", landed: 18, avgMultiple: 3.4, reach: 1_240_000 },
    { handle: "caller_two", wallet: "9fTa…LmZ4", landed: 12, avgMultiple: 2.8, reach: 860_000 },
    { handle: "caller_three", wallet: "Bq3n…Wd8s", landed: 9, avgMultiple: 2.1, reach: 410_000 },
  ],
  meta: [
    { meta: "AI agents", chain: "Solana", share: 0.31, change24h: 0.06 },
    { meta: "Attention / social", chain: "Solana", share: 0.24, change24h: 0.11 },
    { meta: "Dog derivatives", chain: "Solana", share: 0.18, change24h: -0.04 },
    { meta: "Base memes", chain: "Base", share: 0.15, change24h: 0.02 },
    { meta: "Everything else", chain: "—", share: 0.12, change24h: -0.03 },
  ],
  chains: [
    { chain: "Solana", share: 0.68, net24h: 12.4 },
    { chain: "Base", share: 0.19, net24h: 3.1 },
    { chain: "BNB", share: 0.08, net24h: -1.2 },
    { chain: "Ethereum", share: 0.05, net24h: -0.4 },
  ],
};

export async function getTerminalFeed(): Promise<TerminalFeed> {
  return { source: "sample", updatedAt: new Date().toISOString(), ...SAMPLE };
}
