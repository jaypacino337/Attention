"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MIN_ELIGIBLE, TOKEN } from "@/lib/config";

type Result = {
  wallet: string;
  balance: number | null;
  min: number;
  holderPool: boolean | null;
  program?: boolean;
  xPool: { handle: string; label: string; expiresAt: number; paid: boolean | null } | null;
};

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const days = (t: number) => Math.max(0, Math.ceil((t - Date.now()) / 86_400_000));

/** Paste a wallet → see both pools. Read-only: nothing to connect, sign or claim. */
export function EligibilityCheck() {
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/eligibility?wallet=${encodeURIComponent(wallet.trim())}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Check failed");
      setRes(json);
    } catch (err) {
      setRes(null);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5 md:p-8">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="elig-wallet" className="sr-only">Solana wallet address</label>
        <input
          id="elig-wallet"
          className="field"
          placeholder="Paste any Solana wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="btn btn-ink shrink-0 justify-center" disabled={busy || wallet.trim().length < 32}>
          {busy ? "Checking…" : "Check wallet"}
        </button>
      </form>
      <p className="mt-3 font-mono text-[11px] text-ink-faint">Read-only lookup. You never connect or sign anything here.</p>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 border-2 border-ink bg-white p-3 font-mono text-sm" role="alert">
            {error}
          </motion.p>
        ) : res ? (
          <motion.div
            key={res.wallet}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div className={`border-2 border-ink p-5 ${res.holderPool ? "bg-cobalt text-white" : "bg-white"}`}>
              <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-80">Holder pool · 50%</p>
              <p className="display mt-3 text-4xl">{res.holderPool === null ? "Unknown" : res.holderPool ? "You're in" : "Not yet"}</p>
              <p className="mt-2 text-sm opacity-90">
                {res.program
                  ? "That's a program account (a pool, curve or vault). They're excluded from payouts."
                  : res.balance === null
                  ? "Couldn't read the balance right now. Try again in a minute."
                  : res.holderPool
                    ? `${fmt(res.balance)} $${TOKEN.symbol}. Paid pro-rata every cycle, automatically.`
                    : `${fmt(res.balance)} $${TOKEN.symbol}. Hold ${fmt(MIN_ELIGIBLE - res.balance)} more to qualify.`}
              </p>
            </div>
            <div className={`border-2 border-ink p-5 ${res.xPool && res.xPool.paid !== false ? "bg-ink text-paper" : "bg-white"}`}>
              <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-80">𝕏 caller pool · 40%</p>
              <p className="display mt-3 text-4xl">{res.xPool ? `@${res.xPool.handle}` : "Not linked"}</p>
              <p className="mt-2 text-sm opacity-90">
                {res.xPool ? (
                  <>
                    Seat {res.xPool.label}, live for {days(res.xPool.expiresAt)} more day{days(res.xPool.expiresAt) === 1 ? "" : "s"}.
                    {res.xPool.paid === false ? " Below 250K, so it isn't paid until you top up." : " Post again any time to renew."}
                  </>
                ) : (
                  <>
                    Post one callout to join.{" "}
                    <Link href={`/x?wallet=${res.wallet}`} className="font-bold underline decoration-2 underline-offset-4">
                      Get your code →
                    </Link>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
