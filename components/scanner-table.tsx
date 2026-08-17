import type { ScannerCallView } from "@/lib/scanner";
import { Scanning } from "./scanning";

const pct = (n: number) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(0)}%`;
const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

const statusTone: Record<string, string> = {
  EARLY: "text-[var(--color-orange)] border-[var(--color-orange)]",
  "HEATING UP": "text-[var(--color-orange)] border-[var(--color-orange)]",
  TRENDING: "text-[var(--text)] border-[var(--text)]",
  COOLING: "text-[var(--text-faint)] border-[var(--line)]",
  CLOSED: "text-[var(--text-faint)] border-[var(--line)]",
};

function date(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toISOString().slice(0, 10);
}

export function ScannerEmpty() {
  return (
    <div className="border border-dashed rule">
      <Scanning line="Calls publish here as attention forms — and stay here permanently, hits and misses alike." />
    </div>
  );
}

/**
 * The permanent scanner record. Dense rows, not cards; every number that
 * isn't known is simply absent. Mobile collapses to a two-line row.
 */
export function ScannerTable({
  calls,
  numbered = false,
}: {
  calls: ScannerCallView[];
  numbered?: boolean;
}) {
  if (calls.length === 0) return <ScannerEmpty />;

  return (
    <div className="border rule bg-[var(--ground-raised)]">
      {calls.map((call, index) => (
        <article key={call.id} className={index > 0 ? "border-t rule" : ""}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-3 sm:px-5">
            {numbered ? (
              <span className="font-mono text-xs text-[var(--text-faint)]">
                {String(index + 1).padStart(2, "0")}
              </span>
            ) : null}
            <h3 className="text-sm font-bold">
              {call.asset}
              {call.ticker ? (
                <span className="ml-2 font-mono text-xs font-normal text-[var(--text-faint)]">
                  ${call.ticker}
                </span>
              ) : null}
            </h3>
            <span
              className={`border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${statusTone[call.status]}`}
            >
              {call.status}
            </span>
            <span className="font-mono text-xs text-[var(--text-faint)]">{call.platform}</span>
            <span className="ml-auto font-mono text-xs text-[var(--text-faint)]">
              {date(call.calledAt)}
            </span>
          </div>

          <p className="px-4 pt-1.5 text-sm text-[var(--text-soft)] sm:px-5">{call.reason}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 pb-3 pt-2 sm:px-5">
            {typeof call.attentionScore === "number" ? (
              <Metric label="ATTN" value={String(call.attentionScore)} strong />
            ) : null}
            {typeof call.mcapAtCall === "number" ? (
              <Metric label="called at" value={usd(call.mcapAtCall)} />
            ) : null}
            {typeof call.currentMcap === "number" ? (
              <Metric label="current" value={usd(call.currentMcap)} />
            ) : null}
            {typeof call.peakMcap === "number" ? (
              <Metric label="peak" value={usd(call.peakMcap)} />
            ) : null}
            {call.performance !== null ? (
              <Metric
                label="return"
                value={pct(call.performance)}
                tone={call.performance >= 0 ? "up" : "down"}
              />
            ) : null}
            {call.peakPerformance !== null ? (
              <Metric label="peak return" value={pct(call.peakPerformance)} />
            ) : null}
            {typeof call.rewardsEarned === "number" ? (
              <Metric label="rewards" value={`${call.rewardsEarned} SOL`} />
            ) : null}
            {call.calloutUrl ? (
              <a
                href={call.calloutUrl}
                className="font-mono text-xs font-bold text-[var(--color-orange)] underline underline-offset-4"
              >
                callout →
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
        {label}
      </span>
      <span
        className={`font-mono text-xs ${strong ? "font-bold" : ""} ${
          tone === "up"
            ? "text-[var(--color-orange)]"
            : tone === "down"
              ? "text-[var(--text-faint)]"
              : ""
        }`}
      >
        {value}
      </span>
    </span>
  );
}
