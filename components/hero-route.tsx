"use client";

import { useState } from "react";
import { cryptoRng, planRoute, seeded, type Route } from "@/lib/route";
import { RouteViz } from "./route-viz";

const DEMO = 12_500_000_000n;

/** Homepage demo: a real Standard route for 12.5 SOL. Seeded first so server and client match. */
export function HeroRoute() {
  const [route, setRoute] = useState<Route>(() => planRoute(DEMO, "standard", seeded(42)));
  return (
    <div className="glass relative w-full max-w-md overflow-hidden p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pulse h-2 w-2 rounded-full bg-[var(--color-orange)]" />
          <span className="label">Standard send · 12.5 SOL</span>
        </div>
        <button type="button" onClick={() => setRoute(planRoute(DEMO, "standard", cryptoRng()))} className="font-mono text-[11px] text-[var(--text-soft)] hover:text-[var(--color-orange)]">↻ New route</button>
      </div>
      <RouteViz route={route} total={DEMO} compact />
    </div>
  );
}
