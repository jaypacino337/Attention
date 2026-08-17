"use client";

import Link from "next/link";
import { Mark } from "./mark";
import { ConnectButton } from "./connect-button";

const LINKS = [
  { href: "/#tokenomics", label: "Fees" },
  { href: "/#rewards", label: "Rewards" },
  { href: "/terminal", label: "Terminal" },
  { href: "/#adspace", label: "Ad space" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b rule bg-[var(--ground)]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <Mark className="h-7 w-7" />
          <span className="text-[15px]">
            Attention <span className="serif-italic font-normal">Markets</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-soft)] hover:text-[var(--color-orange)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <ConnectButton />
      </nav>
    </header>
  );
}
