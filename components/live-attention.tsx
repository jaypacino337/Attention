"use client";

import { useState } from "react";
import type { AttentionRow, LiveAttention } from "@/lib/live";

/**
 * The Live Attention module: TRENDING / CALLOUTS / X ATTENTION / SCANNER.
 *
 * Rows are market intelligence, not cards: dense, bordered, monospace where
 * the numbers are. Empty tabs say plainly that the feed isn't lit yet —
 * loading and empty states beat fake data, always.
 */

const TABS = [
  { id: "trending", label: "Trending" },
  { id: "callouts", label: "Callouts" },
  { id: "xattention", label: "X Attention" },
  { id: "scanner", label: "Scanner" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_COPY: Record<TabId, string> = {
  trending: "No trending feed yet. The terminal lights this up as curation and live signals land.",
  callouts: "No callouts on record yet. Every pump.fun and FOMO call will appear here — permanently.",
  xattention: "X attention tracking arrives with account linking. Nothing is shown until it's real.",
  scanner: "The scanner hasn't published calls yet. When it does, the full history lives here — hits and misses.",
};

const pct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(0)}%`;

const statusTone: Record<string, string> = {
  EARLY: "text-[var(--color-orange)] border-[var(--color-orange)]",
  "HEATING UP": "text-[var(--color-orange)] border-[var(--color-orange)]",
  TRENDING: "text-[var(--text)] border-[var(--text)]",
  COOLING: "text-[var(--text-faint)] border-[var(--line)]",
  CLOSED: "text-[var(--text-faint)] border-[var(--line)]",
};

function since(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.max(1, Math.round(ms / 60_000))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function Row({ row }: { row: AttentionRow }) {
  const detected = since(row.detected);
  const body = (
    <div className="flex items-center gap-3 px-4 py-3 sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{row.asset}</p>
        {row.sub ? (
          <p className="mt-0.5 truncate text-xs text-[var(--text-faint)]">{row.sub}</p>
        ) : null}
      </div>

      {row.status ? (
        <span
          className={`hidden shrink-0 border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider sm:inline ${statusTone[row.status] ?? "border-[var(--line)]"}`}
        >
          {row.status}
        </span>
      ) : null}

      {row.platform ? (
        <span className="hidden w-16 shrink-0 text-right font-mono text-xs text-[var(--text-faint)] md:inline">
          {row.platform}
        </span>
      ) : null}

      {detected ? (
        <span className="hidden w-10 shrink-0 text-right font-mono text-xs text-[var(--text-faint)] sm:inline">
          {detected}
        </span>
      ) : null}

      <div className="flex w-24 shrink-0 flex-col items-end">
        {typeof row.score === "number" ? (
          <span className="font-mono text-sm font-bold">
            {row.score}
            <span className="text-[10px] text-[var(--text-faint)]"> ATTN</span>
          </span>
        ) : null}
        {typeof row.delta === "number" ? (
          <span
            className={`font-mono text-xs ${row.delta >= 0 ? "text-[var(--color-orange)]" : "text-[var(--text-faint)]"}`}
          >
            {pct(row.delta)}
          </span>
        ) : null}
        {typeof row.performance === "number" ? (
          <span
            className={`font-mono text-xs ${row.performance >= 0 ? "text-[var(--color-orange)]" : "text-[var(--text-faint)]"}`}
          >
            {pct(row.performance)}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (row.href) {
    return (
      <a href={row.href} className="block border-t rule hover:bg-[var(--ground)]">
        {body}
      </a>
    );
  }
  return <div className="border-t rule">{body}</div>;
}

export function LiveAttentionModule({ data }: { data: LiveAttention }) {
  const [tab, setTab] = useState<TabId>(() => {
    // Open on the first tab that actually has data; scanner is the flagship.
    const first = TABS.find((t) => data[t.id].length > 0);
    return first?.id ?? "scanner";
  });
  const rows = data[tab];

  return (
    <div className="border rule bg-[var(--ground-raised)]">
      <div className="flex items-center justify-between gap-2 border-b rule px-2 sm:px-4">
        <div className="flex overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-3 py-3 font-mono text-[11px] font-bold uppercase tracking-widest sm:px-4 ${
                tab === t.id
                  ? "border-[var(--color-orange)] text-[var(--text)]"
                  : "border-transparent text-[var(--text-faint)] hover:text-[var(--text)]"
              }`}
            >
              {t.label}
              {data[t.id].length > 0 ? (
                <span className="ml-1.5 text-[var(--color-orange)]">{data[t.id].length}</span>
              ) : null}
            </button>
          ))}
        </div>
        <span className="hidden items-center gap-1.5 pr-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)]" />
          <span className="label">live</span>
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-faint)]">
            awaiting signal
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-[var(--text-soft)]">{EMPTY_COPY[tab]}</p>
        </div>
      ) : (
        <div>
          {rows.slice(0, 8).map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
