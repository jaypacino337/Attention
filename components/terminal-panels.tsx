import type { TerminalFeed } from "@/lib/terminal";
import type { ScannerCallView } from "@/lib/scanner";
import type { Leaderboard } from "@/lib/leaderboard";
import { ScannerTable } from "./scanner-table";

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

/** Blur-gated panel for holders below the Operator tier. */
function Locked({ min, children }: { min: number; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center bg-[var(--ground-raised)]/70">
        <p className="px-4 text-center text-sm font-semibold">
          Hold {min.toLocaleString("en-US")} $ATTENTION to unlock
        </p>
      </div>
    </div>
  );
}

export function TerminalPanels({
  feed,
  scannerCalls,
  leaderboard,
  isOperator,
  operatorMin,
}: {
  feed: TerminalFeed;
  scannerCalls: ScannerCallView[];
  leaderboard: Leaderboard | null;
  isOperator: boolean;
  operatorMin: number;
}) {
  // Real on-chain holders when the scan is live; curated/sample feed otherwise.
  const holdersTable = leaderboard ? (
    <table className="w-full text-sm">
      <thead>
        <tr className="label">
          <th className="pb-2 text-left font-normal">Holder</th>
          <th className="pb-2 text-right font-normal">Balance</th>
          <th className="pb-2 text-right font-normal">Tier</th>
        </tr>
      </thead>
      <tbody className="font-mono">
        {leaderboard.top.slice(0, 10).map((entry) => (
          <tr key={entry.owner} className="border-t rule">
            <td className="py-2" title={entry.owner}>
              {entry.display}
            </td>
            <td className="py-2 text-right">{entry.balance.toLocaleString("en-US")}</td>
            <td className="py-2 text-right text-[var(--text-faint)]">{entry.tier}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : null;

  const wallets = (
    <table className="w-full text-sm">
      <thead>
        <tr className="label">
          <th className="pb-2 text-left font-normal">Wallet</th>
          <th className="pb-2 text-right font-normal">7d PnL</th>
          <th className="pb-2 text-right font-normal">Win</th>
          <th className="pb-2 text-right font-normal">Calls</th>
        </tr>
      </thead>
      <tbody className="font-mono">
        {feed.topWallets.map((wallet) => (
          <tr key={wallet.address} className="border-t rule">
            <td className="py-2">
              {wallet.address}
              <span className="ml-2 font-sans text-xs text-[var(--text-faint)]">{wallet.label}</span>
            </td>
            <td className="py-2 text-right text-[var(--color-orange)]">{signed(wallet.pnl7d)}</td>
            <td className="py-2 text-right">{pct(wallet.winRate)}</td>
            <td className="py-2 text-right">{wallet.callouts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const chains = (
    <ul className="space-y-3">
      {feed.chains.map((chain) => (
        <li key={chain.chain}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">{chain.chain}</span>
            <span className="font-mono text-[var(--text-soft)]">
              {pct(chain.share)} · {signed(chain.net24h)}
            </span>
          </div>
          <div className="mt-1 h-1 w-full bg-[var(--line)]">
            <div
              className="h-full bg-[var(--color-orange)]"
              style={{ width: `${chain.share * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid gap-6">
      <Panel title="Scanner" note={`${scannerCalls.length} calls on record`}>
        {scannerCalls.length === 0 ? (
          <p className="py-2 text-sm text-[var(--text-soft)]">
            No scanner calls published yet. The permanent record appears here the moment the first
            call fires.
          </p>
        ) : (
          <ScannerTable calls={scannerCalls.slice(0, 4)} />
        )}
      </Panel>

      <Panel title="X Attention" note="landed calls">
        <ul className="divide-y rule">
          {feed.topCallers.map((caller, index) => (
            <li key={caller.handle} className="flex items-center gap-4 py-3">
              <span className="font-mono text-sm text-[var(--text-faint)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">@{caller.handle}</p>
                <p className="font-mono text-xs text-[var(--text-faint)]">{caller.wallet}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono font-bold">{caller.avgMultiple.toFixed(1)}x</p>
                <p className="text-xs text-[var(--text-faint)]">{caller.landed} landed</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Trending" note="24h rotation">
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
      </Panel>

      <Panel
        title={leaderboard ? "Top holders" : "Top wallets"}
        note={
          isOperator
            ? leaderboard
              ? `on-chain · ${leaderboard.eligibleHolders} eligible`
              : "7d"
            : "500K only"
        }
      >
        {isOperator ? (
          (holdersTable ?? wallets)
        ) : (
          <Locked min={operatorMin}>{holdersTable ?? wallets}</Locked>
        )}
      </Panel>

      <Panel title="Chain flow" note={isOperator ? "24h net" : "500K only"}>
        {isOperator ? chains : <Locked min={operatorMin}>{chains}</Locked>}
      </Panel>
    </div>
  );
}
