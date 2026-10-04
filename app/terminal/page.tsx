import type { Metadata } from "next";
import { TerminalPanels } from "@/components/terminal-panels";
import { getTerminalFeed } from "@/lib/terminal";
import { loadScannerCalls } from "@/lib/scanner";
import { getLeaderboard } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Attention Terminal" };
export const dynamic = "force-dynamic";

/** Public terminal. Rewards need no wallet connect, so there is nothing to gate on. */
export default async function TerminalPage() {
  const [feed, scannerCalls, leaderboard] = await Promise.all([getTerminalFeed(), loadScannerCalls(), getLeaderboard()]);
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <p className="label !text-ink">Live intelligence</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,8vw,6rem)]">
        Attention <span className="serif-italic text-cobalt">terminal</span>
      </h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Where attention is <strong className="text-ink">now</strong>. For where it may be going next, open the{" "}
        <a href="/scanner" className="font-bold text-cobalt underline underline-offset-4">Scanner</a>.
      </p>
      {feed.source === "manual" ? <p className="label mt-6">curated by the team</p> : null}
      <div className="mt-8">
        <TerminalPanels feed={feed} scannerCalls={scannerCalls} leaderboard={leaderboard} />
      </div>
    </section>
  );
}
