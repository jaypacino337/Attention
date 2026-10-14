"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./mark";
import { WalletButton } from "./solana-wallet";
import { LINKS as EXTERNAL } from "@/lib/config";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/swap", label: "Swap" },
  { href: "/send", label: "Send" },
  { href: "/docs", label: "Docs" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b rule bg-[var(--ground)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight">
          <Mark className="h-7 w-7" />
          <span className="text-[15px]">PRVC</span>
        </Link>

        <div className="flex items-center gap-4 overflow-x-auto sm:gap-6">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest ${
                  active
                    ? "text-[var(--color-orange)]"
                    : "text-[var(--text-soft)] hover:text-[var(--color-orange)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={EXTERNAL.x}
            aria-label="PRVC on X"
            className="hidden font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--text-soft)] hover:text-[var(--color-orange)] sm:inline"
          >
            𝕏
          </a>
          <WalletButton />
        </div>
      </nav>
    </header>
  );
}
