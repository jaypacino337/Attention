/**
 * Attention Terminal feed — where attention is NOW.
 * (The Scanner is where attention may be going next.)
 *
 * There is no sample data served here. The feed is empty until either the
 * team curates data/terminal.json (source: "manual") or live integrations
 * land (source: "live"). Empty sections render as an active scanning state —
 * real data > empty state > fake data, always.
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
  /** empty = nothing yet; manual = curated via data/terminal.json; live = API-fed. */
  source: "empty" | "manual" | "live";
  updatedAt: string;
  topWallets: TopWallet[];
  topCallers: TopCaller[];
  meta: MetaRow[];
  chains: ChainFlow[];
};

type ManualFeed = Partial<Pick<TerminalFeed, "topWallets" | "topCallers" | "meta" | "chains">>;

/**
 * Manual curation: commit real numbers to data/terminal.json (see
 * data/terminal.example.json for the shape; all keys optional). Editing the
 * file on GitHub triggers a redeploy. Delete it to return to the empty state.
 */
async function readManualFeed(): Promise<ManualFeed | null> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const raw = await fs.readFile(path.join(process.cwd(), "data", "terminal.json"), "utf8");
    const parsed = JSON.parse(raw) as ManualFeed;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export async function getTerminalFeed(): Promise<TerminalFeed> {
  const manual = await readManualFeed();
  if (manual) {
    return {
      source: "manual",
      updatedAt: new Date().toISOString(),
      topWallets: manual.topWallets ?? [],
      topCallers: manual.topCallers ?? [],
      meta: manual.meta ?? [],
      chains: manual.chains ?? [],
    };
  }
  return {
    source: "empty",
    updatedAt: new Date().toISOString(),
    topWallets: [],
    topCallers: [],
    meta: [],
    chains: [],
  };
}
