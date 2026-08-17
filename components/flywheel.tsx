/**
 * The flywheel, as two connected loops instead of a seven-step chain.
 *
 * Primary loop: fees reward attention, which creates more attention.
 * Protocol loop: a slice of fees capitalizes the fund; realized profits and
 * callout rewards buy back and burn. Pure markup — the linework is the story.
 */

function Node({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-block border px-3 py-2 font-mono text-[11px] font-bold tracking-wider ${
        accent
          ? "border-[var(--color-orange)] text-[var(--color-orange)]"
          : "rule text-[var(--text)]"
      }`}
    >
      {label}
    </span>
  );
}

const Arrow = () => (
  <span aria-hidden="true" className="font-mono text-sm text-[var(--text-faint)]">
    →
  </span>
);

export function Flywheel() {
  return (
    <div className="max-w-xl">
      {/* Primary loop */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Node label="CREATOR FEES" />
        <Arrow />
        <Node label="REWARD ATTENTION" accent />
        <Arrow />
        <Node label="MORE ATTENTION" />
        <span
          aria-hidden="true"
          className="font-mono text-sm text-[var(--text-faint)]"
          title="loops back"
        >
          ⟲
        </span>
      </div>

      {/* Connector: the fund slice */}
      <div className="ml-5 flex items-center gap-2 py-2" aria-hidden="true">
        <span className="h-8 w-px bg-[var(--line)]" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
          a slice of fees
        </span>
      </div>

      {/* Protocol loop */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Node label="ATTENTION FUND" accent />
        <Arrow />
        <Node label="TRADES + CALLOUTS" />
        <Arrow />
        <Node label="REALIZED PROFITS + REWARDS" />
      </div>
      <div className="ml-5 flex items-center gap-2 py-2" aria-hidden="true">
        <span className="h-8 w-px bg-[var(--line)]" />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Node label="BUYBACK + BURN" accent />
        <Arrow />
        <span className="font-mono text-xl font-bold tracking-tight text-[var(--color-orange)]">
          $ATTENTION
        </span>
      </div>

      <p className="mt-5 max-w-md text-xs leading-relaxed text-[var(--text-faint)]">
        Realized profits only — nothing here implies every trade wins.
      </p>
    </div>
  );
}
