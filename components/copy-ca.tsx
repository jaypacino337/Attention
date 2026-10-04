"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TOKEN } from "@/lib/config";
import { cn } from "@/lib/cn";

/** The contract address, click-to-copy. */
export function CopyCA({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${TOKEN.mint.slice(0, 6)}…${TOKEN.mint.slice(-6)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(TOKEN.mint);
    } catch {
      window.prompt("Copy the contract address:", TOKEN.mint);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={TOKEN.mint}
      className={cn("lift group flex max-w-full items-stretch border-2 border-ink bg-white text-left shadow-[4px_4px_0_0_var(--color-ink)]", className)}
    >
      <span className="grid place-items-center bg-ink px-3 font-mono text-[11px] font-extrabold tracking-widest text-paper">CA</span>
      <span className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-xs font-bold sm:hidden">{short}</span>
      <span className="hidden min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-xs font-bold sm:inline">{TOKEN.mint}</span>
      <span className="relative grid w-20 shrink-0 place-items-center overflow-hidden border-l-2 border-ink bg-cobalt font-mono text-[11px] font-extrabold uppercase tracking-widest text-white">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "y" : "n"}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {copied ? "Copied" : "Copy"}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
