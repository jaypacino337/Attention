"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

export type BoardSeat = { label: string; wallet: string; x: string; postId: string | null; expiresAt: number };

const short = (w: string) => `${w.slice(0, 4)}…${w.slice(-4)}`;

/** The live 𝕏 caller list. Each row's bar is the time left on that callout. */
export function CallerBoard({ seats, windowDays, limit, now }: { seats: BoardSeat[]; windowDays: number; limit?: number; now: number }) {
  const rows = [...seats].sort((a, b) => b.expiresAt - a.expiresAt).slice(0, limit ?? seats.length);
  const windowMs = windowDays * 86_400_000;

  if (!rows.length) {
    return (
      <div className="panel grid place-items-center gap-4 p-10 text-center">
        <p className="display text-4xl md:text-5xl">Seat 1A is open.</p>
        <p className="max-w-md text-ink-soft">No verified callers yet. The first holder to post their code takes the first share of the 𝕏 pool.</p>
        <Link href="/x" className="btn btn-cobalt">Claim it</Link>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden !bg-white">
      <div className="grid grid-cols-[3.5rem_1fr_auto] gap-3 border-b-2 border-ink bg-ink px-4 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-paper sm:grid-cols-[4rem_1.3fr_1fr_8rem]">
        <span>Seat</span>
        <span>Caller</span>
        <span className="hidden sm:block">Wallet</span>
        <span className="text-right">Time left</span>
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {rows.map((s) => {
            const left = Math.max(0, s.expiresAt - now);
            const pct = Math.min(100, (left / windowMs) * 100);
            const d = Math.ceil(left / 86_400_000);
            return (
              <motion.li
                layout
                key={s.wallet}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 border-b-2 border-ink/10 px-4 py-3 last:border-0 hover:bg-paper sm:grid-cols-[4rem_1.3fr_1fr_8rem]"
              >
                <span className="display text-xl text-cobalt">{s.label}</span>
                <a
                  href={s.postId ? `https://x.com/${s.x}/status/${s.postId}` : `https://x.com/${s.x}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-bold hover:text-cobalt"
                >
                  @{s.x}
                </a>
                <span className="hidden font-mono text-xs text-ink-soft sm:block">{short(s.wallet)}</span>
                <span className="flex items-center justify-end gap-2">
                  <span className="hidden h-2.5 w-14 border border-ink bg-paper sm:block">
                    <span className="block h-full bg-cobalt" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="font-mono text-xs font-bold">{d}d</span>
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
