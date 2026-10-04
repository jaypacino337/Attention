"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MIN_ELIGIBLE, TOKEN, X_POOL } from "@/lib/config";
import { cn } from "@/lib/cn";

type Lookup = {
  wallet: string;
  balance: number | null;
  phrase: string;
  xPool: { handle: string; label: string; expiresAt: number } | null;
};
type Claimed =
  | { status: "seated" | "renewed"; label: string; expiresAt: number; handle: string }
  | { status: "waitlisted"; position: number; handle: string };

const fmt = (n: number) => Math.floor(n).toLocaleString("en-US");
const date = (t: number) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const KEY = "attn:wallet";

function Step({ n, title, active, done, children }: { n: number; title: string; active: boolean; done: boolean; children: React.ReactNode }) {
  return (
    <section className={cn("border-2 border-ink transition-colors", active ? "bg-white shadow-[6px_6px_0_0_var(--color-ink)]" : "bg-paper-2/60")}>
      <header className="flex items-center gap-3 border-b-2 border-ink px-4 py-3">
        <span className={cn("grid h-8 w-8 place-items-center border-2 border-ink font-mono text-sm font-extrabold", done ? "bg-cobalt text-white" : active ? "bg-ink text-paper" : "bg-paper")}>
          {done ? "✓" : n}
        </span>
        <h3 className="display text-xl md:text-2xl">{title}</h3>
      </header>
      <div className={cn("p-4 md:p-6", !active && !done && "opacity-50")}>{children}</div>
    </section>
  );
}

/**
 * Link a wallet to 𝕏 by posting a wallet-bound code. No wallet connect and no
 * signature: the code only works for the wallet it was generated for, and
 * payouts only ever go TO that wallet, so there's nothing to steal.
 */
export function ClaimDesk() {
  const params = useSearchParams();
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [busy, setBusy] = useState<"lookup" | "claim" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Claimed | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let initial = params.get("wallet") ?? "";
    if (!initial) {
      try {
        initial = localStorage.getItem(KEY) ?? "";
      } catch {}
    }
    if (initial) {
      setWallet(initial);
      void find(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function find(w = wallet) {
    setBusy("lookup");
    setError(null);
    setClaimed(null);
    try {
      const r = await fetch(`/api/eligibility?wallet=${encodeURIComponent(w.trim())}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Lookup failed");
      setLookup(json);
      try {
        localStorage.setItem(KEY, json.wallet);
      } catch {}
    } catch (err) {
      setLookup(null);
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    if (!lookup) return;
    setBusy("claim");
    setError(null);
    try {
      const r = await fetch("/api/seats/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: lookup.wallet, postUrl: postUrl.trim() }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error ?? "Couldn't verify that post");
      setClaimed(json);
      setPostUrl("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function copyPhrase() {
    if (!lookup) return;
    try {
      await navigator.clipboard.writeText(lookup.phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy your phrase:", lookup.phrase);
    }
  }

  const low = lookup?.balance !== null && lookup?.balance !== undefined && lookup.balance < MIN_ELIGIBLE;
  const intent = lookup
    ? `https://x.com/intent/post?text=${encodeURIComponent(`${lookup.phrase}\n\nAttention pays. Holders and 𝕏 callers get paid in SOL, automatically.`)}`
    : "#";

  return (
    <div className="grid gap-5">
      <Step n={1} title="Your wallet" active={!lookup} done={!!lookup}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void find();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="desk-wallet" className="sr-only">Solana wallet address</label>
          <input
            id="desk-wallet"
            className="field"
            placeholder="The Solana wallet that should get paid"
            value={wallet}
            onChange={(e) => {
              setWallet(e.target.value);
              setLookup(null);
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn btn-ink shrink-0 justify-center" disabled={busy !== null || wallet.trim().length < 32}>
            {busy === "lookup" ? "Loading…" : lookup ? "Change" : "Get my code"}
          </button>
        </form>
        {lookup ? (
          <p className="mt-3 font-mono text-xs">
            {lookup.balance === null
              ? "Balance unavailable right now: we'll check it when you link."
              : `${fmt(lookup.balance)} $${TOKEN.symbol} ${low ? `· you need ${fmt(MIN_ELIGIBLE)}+ to be paid` : "· eligible"}`}
            {lookup.xPool ? ` · already seated as @${lookup.xPool.handle} (${lookup.xPool.label}) until ${date(lookup.xPool.expiresAt)}` : ""}
          </p>
        ) : null}
      </Step>

      <Step n={2} title={lookup?.xPool ? "Post a fresh callout to renew" : "Post your callout"} active={!!lookup && !claimed} done={!!claimed}>
        {lookup ? (
          <>
            <p className="text-sm text-ink-soft">Your post must include this line exactly. The code is tied to your wallet, so nobody else can use it.</p>
            <div className="mt-4 flex flex-col border-2 border-ink sm:flex-row">
              <code className="flex-1 break-all bg-paper px-4 py-3 font-mono text-sm font-bold md:text-base">{lookup.phrase}</code>
              <button type="button" onClick={() => void copyPhrase()} className="border-t-2 border-ink bg-white px-4 py-3 font-mono text-xs font-extrabold uppercase tracking-widest hover:bg-cobalt hover:text-white sm:border-l-2 sm:border-t-0">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={intent} target="_blank" rel="noopener noreferrer" className="btn btn-cobalt mt-4">
              Post on 𝕏 ↗
            </a>
            <p className="mt-3 font-mono text-[11px] text-ink-faint">Keep the post public. Add anything you like around it: it's your callout.</p>
          </>
        ) : (
          <p className="text-sm">Enter a wallet first.</p>
        )}
      </Step>

      <Step n={3} title="Paste the link" active={!!lookup && !claimed} done={!!claimed}>
        <form onSubmit={claim} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="desk-post" className="sr-only">Link to your post</label>
          <input
            id="desk-post"
            className="field"
            placeholder="https://x.com/you/status/…"
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
            disabled={!lookup}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="btn btn-cobalt shrink-0 justify-center" disabled={!lookup || busy !== null || postUrl.trim().length < 20}>
            {busy === "claim" ? "Verifying…" : "Verify & link"}
          </button>
        </form>
        <p className="mt-3 font-mono text-[11px] text-ink-faint">We read the public post through 𝕏&apos;s free embed endpoint. No login, no API key, no permissions.</p>
      </Step>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p key={error} role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-2 border-ink bg-white p-4 font-mono text-sm shadow-[4px_4px_0_0_var(--color-cobalt)]">
            ✕ {error}
          </motion.p>
        ) : null}
        {claimed ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.96, rotate: -1 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="border-2 border-ink bg-cobalt p-6 text-white shadow-[6px_6px_0_0_var(--color-ink)]"
            role="status"
          >
            <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em]">@{claimed.handle} is linked</p>
            <p className="display mt-2 text-5xl">
              {claimed.status === "waitlisted" ? `Waitlist #${claimed.position}` : `Seat ${claimed.label}`}
            </p>
            {claimed.status !== "waitlisted" ? (
              <p className="mt-2">
                {claimed.status === "renewed" ? "Renewed. " : ""}Live until {date(claimed.expiresAt)}. You&apos;re paid a share of the 𝕏 pool every {X_POOL.cron === "0 */6 * * *" ? "6 hours" : "cycle"} while you hold {fmt(MIN_ELIGIBLE)}+. Nothing to claim.
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
