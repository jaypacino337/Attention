"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "./mark";
import { ConnectButton } from "./connect-button";

const LINKS = [
  { href: "/", label: "Attention" },
  { href: "/scanner", label: "Scanner" },
  { href: "/terminal", label: "Terminal" },
  { href: "/#rewards", label: "Rewards" },
  { href: "/fund", label: "Fund" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b rule bg-[var(--ground)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight">
          <Mark className="h-7 w-7" />
          <span className="hidden text-[15px] sm:inline">
            Attention <span className="serif-italic font-normal">Markets</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 overflow-x-auto sm:gap-6">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("#")[0]) && link.href !== "/#rewards";
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

        <div className="shrink-0">
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}
