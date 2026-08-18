"use client";

import { useState } from "react";
import { TOKEN } from "@/lib/config";

/** The contract address, click-to-copy. The one string every buyer needs. */
export function ContractAddress({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  if (!TOKEN.mint) return null;

  const short = `${TOKEN.mint.slice(0, 6)}…${TOKEN.mint.slice(-6)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(TOKEN.mint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (rare): select-and-copy via prompt as a fallback.
      window.prompt("Copy the contract address:", TOKEN.mint);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={TOKEN.mint}
      className={`group inline-flex max-w-full items-center gap-2 border rule bg-[var(--ground-raised)] px-3 py-2 text-left hover:border-[var(--color-orange)] ${className}`}
    >
      <span className="label shrink-0">CA</span>
      <span className="truncate font-mono text-xs font-bold sm:hidden">{short}</span>
      <span className="hidden truncate font-mono text-xs font-bold sm:inline">{TOKEN.mint}</span>
      <span
        className={`shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider ${
          copied ? "text-[var(--color-lime)]" : "text-[var(--color-orange)] group-hover:underline"
        }`}
      >
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
