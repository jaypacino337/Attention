"use client";

import { useState } from "react";
import { Scanning } from "./scanning";

/**
 * X Attention leaderboard — the 40% pool's scoreboard.
 *
 * Rows come from real, curated or live data only; with none, the empty state
 * sells the loop (create attention → climb → get rewarded) instead of showing
 * invented accounts. Scoring stays modular: rows carry whatever metrics are
 * known and the table renders only the columns that have data.
 */

export type XLeaderboardRow = {
  handle: string;
  wallet?: string;
  /** 0–100, from lib/attention-score inputs when live. */
  score?: number;
  views?: number;
  engagement?: number;
  landed?: number;
  /** SOL earned from the X pool. */
  reward?: number;
  /** Window this row belongs to; rows without one show in every window. */
  window?: "24h" | "7d" | "30d";
};

const WINDOWS = ["24h", "7d", "30d", "all"] as const;
type Window = (typeof WINDOWS)[number];

const compactNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

export function XLeaderboard({ rows }: { rows: XLeaderboardRow[] }) {
  const [window, setWindow] = useState<Window>("all");
  const visible =
    window === "all" ? rows : rows.filter((row) => !row.window || row.window === window);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b rule pb-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-faint)]">
          Create attention → climb the board → get rewarded
        </p>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={`px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${
                window === w
                  ? "bg-[var(--text)] text-[var(--ground)]"
                  : "text-[var(--text-faint)] hover:text-[var(--text)]"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Scanning
          title="Listening for attention"
          line="Post $ATTENTION on X. Measured attention lands accounts on this board — and 40% of creator fees pay it."
          compact
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="label">
                <th className="py-2 pr-3 text-left font-normal">#</th>
                <th className="py-2 pr-3 text-left font-normal">Account</th>
                <th className="py-2 pr-3 text-right font-normal">ATTN</th>
                <th className="py-2 pr-3 text-right font-normal">Views</th>
                <th className="py-2 pr-3 text-right font-normal">Eng.</th>
                <th className="py-2 text-right font-normal">Reward</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {visible.map((row, index) => (
                <tr key={row.handle} className="border-t rule">
                  <td className="py-2 pr-3 text-[var(--text-faint)]">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-sans font-semibold">@{row.handle}</span>
                    {row.wallet ? (
                      <span className="ml-2 text-xs text-[var(--text-faint)]">{row.wallet}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-right font-bold">
                    {typeof row.score === "number" ? row.score : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {typeof row.views === "number" ? compactNum(row.views) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {typeof row.engagement === "number" ? compactNum(row.engagement) : "—"}
                  </td>
                  <td className="py-2 text-right text-[var(--color-orange)]">
                    {typeof row.reward === "number" ? `${row.reward} SOL` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
