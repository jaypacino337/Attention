"use client";

import { useEffect, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { TOKEN } from "@/lib/config";
import { getBalance, getTokenBalance, sendAndConfirm } from "@/lib/client/rpc";
import { shortAddr, useSolanaWallet } from "./solana-wallet";

const SOL = "So11111111111111111111111111111111111111112";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

const PAY = [
  { symbol: "SOL", mint: SOL },
  { symbol: "USDC", mint: USDC },
  { symbol: "USDT", mint: USDT },
];
const RECEIVE = [
  { symbol: "USDC", mint: USDC },
  { symbol: "USDT", mint: USDT },
  ...(TOKEN.mint ? [{ symbol: TOKEN.symbol, mint: TOKEN.mint }] : []),
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { symbol: "Other…", mint: "custom" },
];
const SLIPPAGE = [50, 100, 300];

type Quote = { out: number; minOut: number; priceImpactPct: number; via: string[] } | { error: string } | null;
type Phase = { kind: "idle" } | { kind: "busy"; step: string } | { kind: "done"; sig: string; text: string } | { kind: "error"; message: string };

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 2 : 6 });

export function SwapPanel() {
  const { address, connect, signTransaction } = useSolanaWallet();
  const [payMint, setPayMint] = useState(SOL);
  const [recvChoice, setRecvChoice] = useState(USDC);
  const [customMint, setCustomMint] = useState("");
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [slippage, setSlippage] = useState(50);
  const [quote, setQuote] = useState<Quote>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const recvMint = recvChoice === "custom" ? customMint.trim() : recvChoice;
  const paySym = PAY.find((p) => p.mint === payMint)?.symbol ?? "";
  const recvSym = RECEIVE.find((r) => r.mint === recvChoice && r.mint !== "custom")?.symbol ?? "tokens";

  useEffect(() => {
    if (!address) return setBalance(null);
    const read = payMint === SOL ? getBalance(address).then((l) => Number(l) / 1e9) : getTokenBalance(address, payMint);
    read.then(setBalance).catch(() => setBalance(null));
  }, [address, payMint, phase.kind]);

  // debounced live quote
  useEffect(() => {
    setQuote(null);
    if (!amount || !Number(amount) || recvMint.length < 32) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/swap/quote?in=${payMint}&out=${recvMint}&amount=${encodeURIComponent(amount)}&slippageBps=${slippage}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then(setQuote)
        .catch(() => {});
    }, 400);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [amount, payMint, recvMint, slippage]);

  const ok = quote && "out" in quote;
  const over = balance !== null && Number(amount) > balance;
  const ready = Boolean(address && ok && to.trim().length >= 32 && !over);

  async function swap() {
    if (!address) return;
    try {
      setPhase({ kind: "busy", step: "Building the swap…" });
      const r = await fetch("/api/swap/build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: address, recipient: to.trim(), inputMint: payMint, outputMint: recvMint, amount, slippageBps: slippage }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error ?? "Could not build the swap.");
      if (!b.simulation.ok) throw new Error(b.simulation.error);

      setPhase({ kind: "busy", step: "Approve in your wallet…" });
      const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b.tx), (c) => c.charCodeAt(0)));
      const signed = await signTransaction(tx);

      setPhase({ kind: "busy", step: "Swapping…" });
      const sig = await sendAndConfirm(signed.serialize(), b.lastValidBlockHeight);
      const got = Number(b.quote.outAmount) / 10 ** b.outDecimals;
      setPhase({ kind: "done", sig, text: `${fmt(got)} ${recvSym} went to ${shortAddr(to.trim())}. On-chain it reads as your own swap.` });
      setAmount("");
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setPhase(/reject|denied|cancel/i.test(m) ? { kind: "idle" } : { kind: "error", message: m });
    }
  }

  const busy = phase.kind === "busy";

  return (
    <div className="glass mx-auto max-w-lg p-5 md:p-6">
      <div className="flex items-baseline justify-between">
        <span className="label">You pay</span>
        {balance !== null ? (
          <button type="button" onClick={() => setAmount(String(payMint === SOL ? Math.max(0, balance - 0.01).toFixed(4) : balance))} className="font-mono text-[11px] text-[var(--text-soft)] hover:text-[var(--color-orange)]">
            Balance {fmt(balance)} · Max
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))} inputMode="decimal" placeholder="0.00" aria-label="Amount to pay" className="field font-mono text-2xl" />
        <select value={payMint} onChange={(e) => setPayMint(e.target.value)} aria-label="Pay with" className="field w-28 font-bold">
          {PAY.map((p) => <option key={p.mint} value={p.mint}>{p.symbol}</option>)}
        </select>
      </div>

      <div className="my-4 flex items-center gap-3 text-[var(--text-faint)]"><span className="h-px flex-1 bg-[var(--line)]" /><span className="font-mono text-xs">↓ swapped straight into their wallet</span><span className="h-px flex-1 bg-[var(--line)]" /></div>

      <span className="label">They receive</span>
      <div className="mt-2 flex gap-2">
        <div className="field flex items-center font-mono text-2xl text-[var(--text)]">{ok ? fmt(quote.out) : quote && "error" in quote ? <span className="text-sm text-[var(--text-soft)]">{quote.error}</span> : <span className="text-[var(--text-faint)]">0.00</span>}</div>
        <select value={recvChoice} onChange={(e) => setRecvChoice(e.target.value)} aria-label="They receive" className="field w-28 font-bold">
          {RECEIVE.map((r) => <option key={r.mint} value={r.mint}>{r.symbol}</option>)}
        </select>
      </div>
      {recvChoice === "custom" ? <input value={customMint} onChange={(e) => setCustomMint(e.target.value)} placeholder="Token mint address" spellCheck={false} className="field mt-2 font-mono text-sm" /> : null}

      <label className="label mt-5 block" htmlFor="swap-to">Recipient wallet</label>
      <input id="swap-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Solana address" spellCheck={false} autoComplete="off" className="field mt-2 font-mono" />

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-[var(--text-soft)]">Slippage</span>
        <div className="flex gap-1">
          {SLIPPAGE.map((s) => (
            <button key={s} type="button" onClick={() => setSlippage(s)} className={`border px-2.5 py-1 font-mono text-xs ${slippage === s ? "border-[var(--color-orange)] text-[var(--color-orange)]" : "rule text-[var(--text-soft)]"}`}>{s / 100}%</button>
          ))}
        </div>
      </div>
      {ok ? (
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">Minimum received</dt><dd className="font-mono">{fmt(quote.minOut)}</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">Price impact</dt><dd className="font-mono">{quote.priceImpactPct < 0.01 ? "<0.01" : quote.priceImpactPct.toFixed(2)}%</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">Route</dt><dd className="font-mono">Jupiter · {quote.via.join(", ")}</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">PRVC fee</dt><dd className="font-mono">0</dd></div>
        </dl>
      ) : null}
      {over ? <p className="mt-3 border-l-2 border-[var(--color-orange)] pl-3 text-sm text-[var(--text-soft)]">Not enough {paySym}.</p> : null}

      <div className="mt-5">
        {!address ? (
          <button type="button" onClick={() => void connect()} className="btn-primary w-full justify-center">Connect wallet</button>
        ) : (
          <button type="button" disabled={!ready || busy} onClick={() => void swap()} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
            {busy ? phase.step : "Swap to recipient"}
          </button>
        )}
      </div>
      {phase.kind === "done" ? (
        <div className="mt-4 border border-[var(--color-orange)]/50 bg-[var(--color-orange-soft)] p-4 text-sm">
          <p className="font-bold">Done.</p>
          <p className="mt-1 text-[var(--text-soft)]">{phase.text}</p>
          <a className="mt-2 inline-block font-mono text-xs text-[var(--color-orange)] underline" href={`https://solscan.io/tx/${phase.sig}`} target="_blank" rel="noreferrer">View on Solscan →</a>
        </div>
      ) : null}
      {phase.kind === "error" ? <p className="mt-4 border-l-2 border-[var(--color-lime)] pl-3 text-sm text-[var(--text-soft)]">{phase.message}</p> : null}
    </div>
  );
}
