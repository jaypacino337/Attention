import fs from "node:fs/promises";
import path from "node:path";

/**
 * Attention Scanner — the intelligence layer. "Where is attention going next?"
 *
 * Calls live in data/scanner.json, a committed file. That gives the scanner a
 * PERMANENT PUBLIC HISTORY for free: every call, good or bad, is in git and on
 * the site. The rule is append-only — bad calls are closed, never deleted.
 *
 * No file (or an empty one) means the scanner page renders its empty state.
 * This module never invents calls. When live Pump.fun / FOMO / X signal
 * ingestion lands, it plugs in behind loadScannerCalls() and nothing above
 * this file changes.
 */

export const SCANNER_STATUSES = [
  "EARLY",
  "HEATING UP",
  "TRENDING",
  "COOLING",
  "CLOSED",
] as const;

export type ScannerStatus = (typeof SCANNER_STATUSES)[number];

export type ScannerCall = {
  id: string;
  /** Asset or narrative name, e.g. "TOKEN" or "AI agents rotation". */
  asset: string;
  ticker?: string;
  platform: "pump.fun" | "fomo" | "x" | "onchain";
  /** ISO timestamp of the call. */
  calledAt: string;
  /** Market cap (USD) at call time / now / at peak — omit what isn't known. */
  mcapAtCall?: number;
  currentMcap?: number;
  peakMcap?: number;
  reason: string;
  /** 0–100; curated or computed via lib/attention-score. Omit if unknown. */
  attentionScore?: number;
  status: ScannerStatus;
  calloutUrl?: string;
  /** SOL earned in callout rewards from this call, where applicable. */
  rewardsEarned?: number;
};

export type ScannerCallView = ScannerCall & {
  /** current / atCall − 1, when both are known. */
  performance: number | null;
  /** peak / atCall − 1, when both are known. */
  peakPerformance: number | null;
};

function view(call: ScannerCall): ScannerCallView {
  const perf = (target?: number) =>
    typeof call.mcapAtCall === "number" && call.mcapAtCall > 0 && typeof target === "number"
      ? target / call.mcapAtCall - 1
      : null;
  return { ...call, performance: perf(call.currentMcap), peakPerformance: perf(call.peakMcap) };
}

function isValidCall(value: unknown): value is ScannerCall {
  if (typeof value !== "object" || value === null) return false;
  const call = value as Record<string, unknown>;
  return (
    typeof call.id === "string" &&
    typeof call.asset === "string" &&
    typeof call.calledAt === "string" &&
    typeof call.reason === "string" &&
    typeof call.status === "string" &&
    (SCANNER_STATUSES as readonly string[]).includes(call.status)
  );
}

/** All calls, newest first. Empty array = render the empty state. */
export async function loadScannerCalls(): Promise<ScannerCallView[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "scanner.json"), "utf8");
    const parsed = JSON.parse(raw) as { calls?: unknown[] };
    if (!Array.isArray(parsed.calls)) return [];
    return parsed.calls
      .filter(isValidCall)
      .map(view)
      .sort((a, b) => Date.parse(b.calledAt) - Date.parse(a.calledAt));
  } catch {
    return [];
  }
}
