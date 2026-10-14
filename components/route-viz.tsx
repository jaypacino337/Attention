"use client";

import { useMemo, useState } from "react";
import { fmtSol, nodeLabel, type Node, type Route } from "@/lib/route";

/**
 * Draws a send route: every wallet is a pillar, every transfer an arc, first
 * transfer at the top. Real parts and decoys look identical until the owner
 * flips "Show real parts", which only ever happens on their own screen.
 */
export function RouteViz({ route, total, compact = false }: { route: Route; total: bigint; compact?: boolean }) {
  const [reveal, setReveal] = useState(false);
  const cols: Node[] = useMemo(
    () => [{ kind: "you" }, ...Array.from({ length: route.relays }, (_, index) => ({ kind: "relay", index }) as Node), { kind: "recipient" }],
    [route.relays],
  );
  const col = (n: Node) => (n.kind === "you" ? 0 : n.kind === "recipient" ? cols.length - 1 : n.index + 1);
  const W = 560;
  const rowH = compact ? 13 : 16;
  const top = 34;
  const H = top + route.transfers.length * rowH + 14;
  const x = (i: number) => 34 + (i * (W - 68)) / (cols.length - 1);
  const max = route.transfers.reduce((m, t) => (t.lamports > m ? t.lamports : m), 1n);
  const real = route.transfers.filter((t) => t.real).length;
  const shown = compact ? route.transfers.slice(0, 8) : route.transfers;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-black tracking-tight text-[var(--text)]">{route.transfers.length}</span>
          <span className="text-sm text-[var(--text-soft)]">transfers · 1 signature from you</span>
        </div>
        <button type="button" onClick={() => setReveal((v) => !v)} aria-pressed={reveal} className={`border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors ${reveal ? "border-[var(--color-orange)] text-[var(--color-orange)]" : "rule text-[var(--text-soft)] hover:text-[var(--text)]"}`}>
          {reveal ? `${real} real · ${route.transfers.length - real} decoy` : "Show real parts"}
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Route with ${route.relays} relays and ${route.transfers.length} transfers`}>
        {cols.map((n, i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={top - 6} y2={H - 6} stroke="var(--line)" strokeWidth={i === 0 || i === cols.length - 1 ? 2 : 1} strokeDasharray={n.kind === "relay" ? "2 3" : undefined} />
            <text x={x(i)} y={14} textAnchor="middle" className="fill-[var(--text-soft)] font-mono" fontSize="10" fontWeight="700">
              {n.kind === "relay" ? `R${n.index + 1}` : n.kind === "you" ? "YOU" : "TO"}
            </text>
          </g>
        ))}
        {route.transfers.map((t, i) => {
          const y = top + i * rowH + rowH / 2;
          const a = x(col(t.from));
          const b = x(col(t.to));
          const w = 1 + 3.5 * (Number(t.lamports) / Number(max));
          const color = reveal ? (t.real ? "var(--color-orange)" : "var(--color-lime)") : "var(--color-orange)";
          const back = b < a;
          return (
            <g key={i} className="route-arc" style={{ animationDelay: `${i * 45}ms` }} opacity={reveal && !t.real ? 0.75 : 0.95}>
              <path d={`M${a},${y} C${a},${y - rowH * 0.9} ${b},${y - rowH * 0.9} ${b},${y}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={back ? "4 3" : undefined} />
              <circle cx={b} cy={y} r={2.4} fill={color} />
            </g>
          );
        })}
      </svg>

      <ol className={`mt-3 divide-y divide-[var(--line)] border-y rule font-mono text-xs ${compact ? "" : "max-h-72 overflow-y-auto"}`}>
        {shown.map((t, i) => (
          <li key={i} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 py-1.5">
            <span className="text-[var(--text-faint)]">{String(i + 1).padStart(2, "0")}</span>
            <span className="truncate text-[var(--text-soft)]">
              {nodeLabel(t.from)} <span className="text-[var(--text-faint)]">→</span> {nodeLabel(t.to)}
              {reveal ? <span className={`ml-2 text-[10px] uppercase ${t.real ? "text-[var(--color-orange)]" : "text-[var(--color-lime)]"}`}>{t.real ? "real" : "decoy"}</span> : null}
            </span>
            <span className="text-right text-[var(--text)]">{fmtSol(t.lamports, 3)}</span>
          </li>
        ))}
      </ol>
      {compact && route.transfers.length > shown.length ? (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-faint)]">+ {route.transfers.length - shown.length} more · {fmtSol(total, 2)} SOL total</p>
      ) : null}
    </div>
  );
}
