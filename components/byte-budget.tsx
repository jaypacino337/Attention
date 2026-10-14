"use client";

import { useMemo, useState } from "react";
import { Keypair } from "@solana/web3.js";
import { LEVELS, seeded, type Level } from "@/lib/route";
import { buildSendTx, byteBreakdown, TX_LIMIT } from "@/lib/send-tx";

const IX_BYTES = 17; // one compiled System transfer: program, 2 accounts, 12 bytes of data, length prefixes
const SEGMENTS = [
  { key: "signatures", label: "Signatures", color: "var(--color-orange)" },
  { key: "addresses", label: "Addresses", color: "color-mix(in oklab, var(--color-orange) 55%, var(--ground))" },
  { key: "header", label: "Blockhash & header", color: "var(--text-faint)" },
  { key: "real", label: "Transfers, real parts", color: "var(--color-lime)" },
  { key: "decoy", label: "Transfers, decoys", color: "color-mix(in oklab, var(--color-lime) 50%, var(--ground))" },
] as const;

/** A real Send transaction at each level, measured byte by byte. Every square is 16 bytes. */
export function ByteBudget() {
  const [level, setLevel] = useState<Level>("standard");
  const data = useMemo(() => {
    const built = buildSendTx({
      sender: Keypair.generate().publicKey,
      recipient: Keypair.generate().publicKey,
      lamports: 12_500_000_000n,
      level,
      rng: seeded(7),
      blockhash: "11111111111111111111111111111111",
    });
    const b = byteBreakdown(built.tx);
    const realN = built.route.transfers.filter((t) => t.real).length;
    const decoyN = built.route.transfers.length - realN;
    const real = realN * IX_BYTES;
    const decoy = decoyN * IX_BYTES;
    const header = b.total - b.signatures - b.addresses - real - decoy;
    return { sizes: { signatures: b.signatures, addresses: b.addresses, header, real, decoy } as Record<string, number>, total: b.total, realN, decoyN, relays: built.relays.length };
  }, [level]);

  const squares: string[] = [];
  for (const s of SEGMENTS) for (let i = 0; i < Math.round(data.sizes[s.key] / 16); i++) squares.push(s.color);
  const cells = Math.ceil(TX_LIMIT / 16);

  return (
    <div className="glass p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" role="tablist" aria-label="Level">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <button key={l} role="tab" aria-selected={level === l} onClick={() => setLevel(l)} className={`border px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${level === l ? "border-[var(--color-orange)] bg-[var(--color-orange)] text-[var(--ground)]" : "rule text-[var(--text-soft)] hover:text-[var(--text)]"}`}>
              {LEVELS[l].label}
            </button>
          ))}
        </div>
        <p className="font-mono text-sm"><span className="text-2xl font-black">{data.total.toLocaleString()}</span> <span className="text-[var(--text-soft)]">/ {TX_LIMIT.toLocaleString()} bytes</span></p>
      </div>
      <div className="bytegrid mt-6" aria-hidden="true">
        {Array.from({ length: cells }, (_, i) => <i key={i} style={squares[i] ? { background: squares[i] } : undefined} />)}
      </div>
      <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <i className="h-2.5 w-2.5 shrink-0" style={{ background: s.color }} />
            <span className="text-[var(--text-soft)]">{s.label}</span>
            <span className="ml-auto font-mono lg:ml-1">{data.sizes[s.key]}B</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 font-mono text-xs text-[var(--text-faint)]">
        {data.relays} relays · {data.realN} real transfers · {data.decoyN} decoy transfers · one signature from you
      </p>
    </div>
  );
}
