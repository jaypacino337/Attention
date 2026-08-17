import type { TerminalFeed } from "@/lib/terminal";
import type { ScannerCallView } from "@/lib/scanner";
import type { Leaderboard } from "@/lib/leaderboard";
import { ScannerTable } from "./scanner-table";
import { Scanning } from "./scanning";
import { XLeaderboard } from "./x-leaderboard";

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
const signed = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}`;

function Panel({
  title, note, children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border rule bg-[var(--ground-raised)]">
      <header className="flex items-center justify-between border-b rule px-5 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {note ? <span className="label">{note}</span> : null}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function TerminalPanels({
  feed,
  scannerCalls,
  leaderboard,
}: {
  feed: TerminalFeed;
  scannerCalls: ScannerCallView[];
  leaderboard: Leaderboard | null;
}) {
  return (
    <div className="grid gap-6">
      <Panel title="X Attention" note="40% of creator fees">
        <XLeaderboard
          rows={feed.topCallers.map((caller) => ({
            handle: caller.handle,
            wallet: caller.wallet,
            landed: caller.landed,
            views: caller.reach,
          }))}
        />
      </Panel>

      <Panel title="Trending" note="24h rotation">
        {feed.meta.length === 0 ? (
          <Scanning title="Scanning for signal" line="Narrative rotation appears here as it is measured." compact />
        ) : (
          <ul className="space-y-3">
            {feed.meta.map((row) => (
              <li key={row.meta} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm font-semibold">{row.meta}</span>
                <div className="h-2 flex-1 bg-[var(--line)]">
                  <div
                    className="h-full bg-[var(--text)]"
                    style={{ width: `${row.share * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-xs">{pct(row.share)}</span>
                <span
                  className={`w-14 text-right font-mono text-xs ${
                    row.change24h >= 0 ? "text-[var(--color-orange)]" : "text-[var(--text-faint)]"
                  }`}
                >
                  {signed(row.change24h * 100)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Scanner" note={scannerCalls.length > 0 ? `${scannerCalls.length} calls on record` : "next"}>
        {scannerCalls.length === 0 ? (
          <Scanning line="Scanner calls publish here — and stay here, hits and misses alike." compact />
        ) : (
          <ScannerTable calls={scannerCalls.slice(0, 4)} />
        )}
      </Panel>

      <Panel
        title="Top holders"
        note={leaderboard ? `on-chain · ${leaderboard.eligibleHolders} eligible` : "on-chain"}
      >
        {leaderboard ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="label">
                <th className="pb-2 text-left font-normal">Holder</th>
                <th className="pb-2 text-right font-normal">Balance</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {leaderboard.top.slice(0, 10).map((entry) => (
                <tr key={entry.owner} className="border-t rule">
                  <td className="py-2" title={entry.owner}>
                    {entry.display}
                  </td>
                  <td className="py-2 text-right">{entry.balance.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Scanning
            title="Reading the chain"
            line="The holder leaderboard builds from the on-chain scan once the token is live."
            compact
          />
        )}
      </Panel>
    </div>
  );
}
