import { loadScannerCalls, type ScannerCallView } from "./scanner";
import { getTerminalFeed } from "./terminal";

/**
 * Rows for the Live Attention module — one normalized shape across the
 * TRENDING / CALLOUTS / X ATTENTION / SCANNER tabs so the UI stays a single
 * component.
 *
 * Sources are the real, curated data files (scanner.json / terminal.json).
 * A tab with no real data returns [] and the UI renders the scanning state.
 */

export type AttentionRow = {
  key: string;
  asset: string;
  sub?: string;
  score?: number;
  /** Signed fraction, e.g. +0.12 attention change or performance. */
  delta?: number;
  platform?: string;
  detected?: string;
  performance?: number;
  status?: string;
  href?: string;
};

export type LiveAttention = {
  trending: AttentionRow[];
  callouts: AttentionRow[];
  xattention: AttentionRow[];
  scanner: AttentionRow[];
};

function fromScanner(call: ScannerCallView): AttentionRow {
  return {
    key: call.id,
    asset: call.ticker ? `${call.asset} · $${call.ticker}` : call.asset,
    sub: call.reason,
    score: call.attentionScore,
    platform: call.platform,
    detected: call.calledAt,
    performance: call.performance ?? undefined,
    status: call.status,
    href: call.calloutUrl,
  };
}

export async function loadLiveAttention(): Promise<LiveAttention> {
  const [calls, feed] = await Promise.all([loadScannerCalls(), getTerminalFeed()]);

  // Terminal data feeds TRENDING and X ATTENTION only when it is curated or
  // live — never from the built-in sample rows.
  const curated = feed.source !== "empty";

  return {
    scanner: calls.map(fromScanner),
    callouts: calls
      .filter((call) => call.platform === "pump.fun" || call.platform === "fomo")
      .map(fromScanner),
    trending: curated
      ? feed.meta.map((row, index) => ({
          key: `meta-${index}`,
          asset: row.meta,
          platform: row.chain,
          delta: row.change24h,
          score: Math.round(row.share * 100),
        }))
      : [],
    xattention: curated
      ? feed.topCallers.map((caller) => ({
          key: caller.handle,
          asset: `@${caller.handle}`,
          sub: `${caller.landed} landed calls`,
          performance: caller.avgMultiple - 1,
          score: undefined,
          platform: "x",
        }))
      : [],
  };
}
