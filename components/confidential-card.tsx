"use client";

import { useEffect, useMemo, useState } from "react";

const HEX = "0123456789abcdef";
const cipher = (n: number) => Array.from({ length: n }, () => HEX[(Math.random() * 16) | 0]).join("");

/**
 * Illustrates a Token-2022 confidential transfer: the same transfer seen on a
 * public ledger vs. with the amount encrypted (twisted ElGamal ciphertext plus
 * zero-knowledge proofs that validators check without learning the amount).
 * It is an illustration, labelled as such, not a live transaction.
 */
export function ConfidentialCard() {
  const [privateMode, setPrivateMode] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1400);
    return () => window.clearInterval(id);
  }, []);

  // regenerate ciphertext so it visibly "breathes"; stable between ticks
  // tick 0 is a fixed value so the server and client render the same markup
  const ct = useMemo(
    () => (tick === 0 ? { amount: "9f3ac1e07b52d84e6a1fc390", balance: "4be27d90c3a615f8e0d47b2a", proof: "c8e15a3f92d07b64" } : { amount: cipher(24), balance: cipher(24), proof: cipher(16) }),
    [tick],
  );

  const row = (label: string, pub: string, priv: string, mono = true) => (
    <div className="flex items-baseline justify-between gap-4 border-b rule py-3 last:border-b-0">
      <span className="label shrink-0">{label}</span>
      <span className={`truncate text-right text-sm ${mono ? "font-mono" : ""} ${privateMode ? "text-[var(--color-orange)]" : "text-[var(--text)]"}`}>
        {privateMode ? priv : pub}
      </span>
    </div>
  );

  return (
    <div className="glass relative w-full max-w-md overflow-hidden p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${privateMode ? "bg-[var(--color-orange)] pulse" : "bg-[var(--text-faint)]"}`} />
          <span className="label">Transfer · illustration</span>
        </div>
        <div role="tablist" aria-label="Ledger view" className="flex border rule p-0.5 text-[11px] font-bold uppercase tracking-widest">
          {(["Public", "Private"] as const).map((m) => {
            const on = (m === "Private") === privateMode;
            return (
              <button
                key={m}
                role="tab"
                aria-selected={on}
                onClick={() => setPrivateMode(m === "Private")}
                className={`px-3 py-1.5 transition-colors ${on ? "bg-[var(--color-orange)] text-[var(--ground)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {row("From", "7xKp…9fQa", "7xKp…9fQa")}
        {row("To", "Bq2W…c4Lm", "Bq2W…c4Lm")}
        {row("Amount", "1,250,000 PRVC", `0x${ct.amount}`)}
        {row("New balance", "8,410,233 PRVC", `0x${ct.balance}`)}
        {row("Proof", "—", `zk:${ct.proof}`)}
      </div>

      <div className={`mt-5 flex items-center gap-3 border p-3 text-sm transition-colors ${privateMode ? "border-[var(--color-orange)]/50 bg-[var(--color-orange-soft)]" : "rule"}`}>
        <span aria-hidden="true" className="text-lg">{privateMode ? "🛡" : "👁"}</span>
        <span className="text-[var(--text-soft)]">
          {privateMode ? (
            <>
              <strong className="text-[var(--text)]">Proof verified.</strong> Validators confirm the amount is valid and the balance never goes negative, without ever seeing either number.
            </>
          ) : (
            <>
              <strong className="text-[var(--text)]">Visible to everyone.</strong> Anyone scanning the chain sees what you sent and what you have left.
            </>
          )}
        </span>
      </div>
    </div>
  );
}
