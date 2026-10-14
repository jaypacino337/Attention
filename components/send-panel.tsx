"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { LEVELS, cryptoRng, fmtSol, planRoute, toLamports, type Level, type Route } from "@/lib/route";
import { buildSendTx, TX_LIMIT } from "@/lib/send-tx";
import { explainSimError, getBalance, latestBlockhash, sendAndConfirm, simulate } from "@/lib/client/rpc";
import { shortAddr, useSolanaWallet } from "./solana-wallet";
import { RouteViz } from "./route-viz";

const MIN_SEND = 1_000_000n; // 0.001 SOL
const RENT_MIN = 890_880n; // a brand-new wallet must end with at least this much
const FEE_BUFFER = 2_000_000n;
const STAND_IN_A = new PublicKey("So11111111111111111111111111111111111111112");
const STAND_IN_B = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

type Phase = { kind: "idle" } | { kind: "busy"; step: string } | { kind: "done"; sig: string; sent: bigint; transfers: number } | { kind: "error"; message: string };

function parseAddress(v: string): PublicKey | null {
  try {
    const k = new PublicKey(v.trim());
    return PublicKey.isOnCurve(k.toBytes()) ? k : null;
  } catch {
    return null;
  }
}

export function SendPanel() {
  const { address, connect, signTransaction, error: walletError } = useSolanaWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [level, setLevel] = useState<Level>("standard");
  const [balance, setBalance] = useState<bigint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const lamports = toLamports(amount);
  const recipient = parseAddress(to);

  const refreshBalance = useCallback(() => {
    if (address) getBalance(address).then(setBalance).catch(() => setBalance(null));
    else setBalance(null);
  }, [address]);
  useEffect(refreshBalance, [refreshBalance]);

  // the route you see is the route you sign: planned once per input change
  useEffect(() => {
    if (!lamports || lamports < MIN_SEND) return setRoute(null);
    setRoute(planRoute(lamports, level, cryptoRng()));
  }, [lamports, level]);

  const fee = useMemo(() => {
    if (!route) return 0n;
    // fees depend only on the route's shape, so stand-in addresses are fine here
    return buildSendTx({ sender: STAND_IN_A, recipient: STAND_IN_B, lamports: lamports ?? 0n, level, rng: cryptoRng(), blockhash: "11111111111111111111111111111111", route }).feeLamports;
  }, [route, lamports, level]);

  const problem = (() => {
    if (!to.trim()) return null;
    if (!recipient) return "That is not a Solana wallet address.";
    if (address && recipient.toBase58() === address) return "That is your own wallet.";
    if (amount && !lamports) return "Enter an amount like 1.5";
    if (lamports && lamports < MIN_SEND) return "Minimum send is 0.001 SOL.";
    if (lamports && balance !== null && lamports + fee > balance) return `Not enough SOL. You have ${fmtSol(balance)} SOL.`;
    return null;
  })();
  const ready = Boolean(address && recipient && lamports && lamports >= MIN_SEND && route && !problem);

  async function send() {
    if (!address || !recipient || !lamports || !route) return;
    try {
      setPhase({ kind: "busy", step: "Checking the recipient…" });
      const recBal = await getBalance(recipient.toBase58());
      if (recBal === 0n && lamports < RENT_MIN) throw new Error("That wallet is brand new: send at least 0.001 SOL so it can exist on-chain.");

      setPhase({ kind: "busy", step: "Building your route…" });
      const { blockhash, lastValidBlockHeight } = await latestBlockhash();
      const built = buildSendTx({ sender: new PublicKey(address), recipient, lamports, level, rng: cryptoRng(), blockhash, route });
      if (built.bytes > TX_LIMIT) throw new Error("Route too large; pick a lower level.");

      const sim = await simulate(built.tx.serialize());
      if (sim.err) throw new Error(explainSimError(sim.err, sim.logs));

      setPhase({ kind: "busy", step: "Approve in your wallet…" });
      const signed = await signTransaction(built.tx);
      // relays co-sign after the wallet, then their keys are dropped
      signed.sign(built.relays);
      built.relays.length = 0;

      setPhase({ kind: "busy", step: "Sending…" });
      const sig = await sendAndConfirm(signed.serialize(), lastValidBlockHeight);
      setPhase({ kind: "done", sig, sent: lamports, transfers: route.transfers.length });
      setAmount("");
      refreshBalance();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setPhase(/reject|denied|cancel/i.test(m) ? { kind: "idle" } : { kind: "error", message: m });
    }
  }

  const busy = phase.kind === "busy";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="glass p-5 md:p-6">
        <label className="label" htmlFor="send-to">Recipient wallet</label>
        <input id="send-to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Solana address" spellCheck={false} autoComplete="off" className="field mt-2 font-mono" />

        <div className="mt-5 flex items-baseline justify-between">
          <label className="label" htmlFor="send-amount">Amount</label>
          {balance !== null ? (
            <button type="button" className="font-mono text-[11px] text-[var(--text-soft)] hover:text-[var(--color-orange)]" onClick={() => setAmount(balance > fee + FEE_BUFFER ? (Number(balance - fee - FEE_BUFFER) / 1e9).toFixed(4) : "0")}>
              Balance {fmtSol(balance)} SOL · Max
            </button>
          ) : null}
        </div>
        <div className="relative mt-2">
          <input id="send-amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(",", "."))} inputMode="decimal" placeholder="0.00" autoComplete="off" className="field pr-14 font-mono text-2xl" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-[var(--text-soft)]">SOL</span>
        </div>

        <p className="label mt-5">Privacy level</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Privacy level">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={level === l} onClick={() => setLevel(l)} className={`border p-3 text-left transition-colors ${level === l ? "border-[var(--color-orange)] bg-[var(--color-orange-soft)]" : "rule hover:border-[var(--text-faint)]"}`}>
              <span className="block text-sm font-bold">{LEVELS[l].label}</span>
              <span className="mt-1 block font-mono text-[10px] text-[var(--text-soft)]">{LEVELS[l].relays} relays · {LEVELS[l].decoys} decoys</span>
            </button>
          ))}
        </div>

        <dl className="mt-5 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">Recipient gets</dt><dd className="font-mono">{lamports ? fmtSol(lamports) : "0"} SOL</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">Network fee</dt><dd className="font-mono">{route ? `~${fmtSol(fee, 6)}` : "—"} SOL</dd></div>
          <div className="flex justify-between"><dt className="text-[var(--text-soft)]">PRVC fee</dt><dd className="font-mono">0</dd></div>
        </dl>

        {problem ? <p className="mt-4 border-l-2 border-[var(--color-orange)] pl-3 text-sm text-[var(--text-soft)]">{problem}</p> : null}

        <div className="mt-5">
          {!address ? (
            <button type="button" onClick={() => void connect()} className="btn-primary w-full justify-center">Connect wallet</button>
          ) : (
            <button type="button" disabled={!ready || busy} onClick={() => void send()} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">
              {busy ? phase.step : "Send privately"}
            </button>
          )}
          {walletError ? <p className="mt-3 text-sm text-[var(--text-soft)]">{walletError}</p> : null}
        </div>

        {phase.kind === "done" ? (
          <div className="mt-4 border border-[var(--color-orange)]/50 bg-[var(--color-orange-soft)] p-4 text-sm">
            <p className="font-bold">Sent. {fmtSol(phase.sent)} SOL arrived at {recipient ? shortAddr(recipient.toBase58()) : "the recipient"}.</p>
            <p className="mt-1 text-[var(--text-soft)]">{phase.transfers} transfers in one transaction. Every relay emptied and its key was thrown away.</p>
            <a className="mt-2 inline-block font-mono text-xs text-[var(--color-orange)] underline" href={`https://solscan.io/tx/${phase.sig}`} target="_blank" rel="noreferrer">View on Solscan →</a>
          </div>
        ) : null}
        {phase.kind === "error" ? <p className="mt-4 border-l-2 border-[var(--color-lime)] pl-3 text-sm text-[var(--text-soft)]">{phase.message}</p> : null}
      </div>

      <div className="glass p-5 md:p-6">
        <div className="flex items-center justify-between">
          <span className="label">Your route · preview</span>
          {route ? (
            <button type="button" onClick={() => lamports && setRoute(planRoute(lamports, level, cryptoRng()))} className="font-mono text-[11px] text-[var(--text-soft)] hover:text-[var(--color-orange)]">↻ Reshuffle</button>
          ) : null}
        </div>
        {route && lamports ? (
          <div className="mt-4">
            <RouteViz route={route} total={lamports} />
            <p className="mt-3 text-xs text-[var(--text-faint)]">This exact route is what you sign. Relay wallets are made fresh in your browser, end at zero and are discarded. If any step fails, nothing moves.</p>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-center text-sm text-[var(--text-faint)]">Enter an amount to see the route your SOL will take.</div>
        )}
      </div>
    </div>
  );
}
