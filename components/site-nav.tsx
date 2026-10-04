"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LINKS } from "@/lib/config";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/x", label: "𝕏 Pool" },
  { href: "/rules", label: "Rules" },
  { href: "/scanner", label: "Scanner" },
  { href: "/fund", label: "Fund" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur-md transition-shadow duration-300",
        scrolled && "shadow-[0_4px_0_0_var(--color-ink)]",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Attention Markets home">
          <span className="grid h-9 w-9 place-items-center border-2 border-ink bg-cobalt text-white shadow-[2px_2px_0_0_var(--color-ink)] transition-transform group-hover:-rotate-6">
            <span className="display text-lg leading-none">A</span>
          </span>
          <span className="display hidden text-[15px] tracking-tight sm:inline">
            Attention<span className="text-cobalt">.</span>Markets
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 py-2 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors",
                  active ? "text-cobalt" : "text-ink hover:text-cobalt",
                )}
              >
                {l.label}
                {active ? <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-[3px] bg-cobalt" /> : null}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a href={LINKS.x} target="_blank" rel="noopener noreferrer" className="btn btn-paper !px-3 !py-2" aria-label="Attention Markets on 𝕏">
            𝕏
          </a>
          <a href={LINKS.pumpfun} target="_blank" rel="noopener noreferrer" className="btn btn-cobalt !px-4 !py-2">
            Buy
          </a>
          <button
            type="button"
            className="btn btn-ink !px-3 !py-2 md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "×" : "≡"}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t-2 border-ink md:hidden"
          >
            <div className="grid px-4 py-2">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href} className="display border-b-2 border-ink/10 py-3 text-3xl last:border-0">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
