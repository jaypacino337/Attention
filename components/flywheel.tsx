/**
 * The protocol flywheel, drawn as a vertical signal chain. Pure markup —
 * no animation library, communicates flow with linework and the brand node.
 */
const STEPS = [
  { label: "CREATOR FEES", accent: false },
  { label: "REWARD ATTENTION", accent: false },
  { label: "MORE ATTENTION", accent: false },
  { label: "ATTENTION FUND", accent: true },
  { label: "CALLOUT REWARDS + TRADING PROFITS", accent: false },
  { label: "BUYBACK + BURN", accent: true },
  { label: "$ATTENTION", accent: true, terminal: true },
] as const;

export function Flywheel() {
  return (
    <ol className="relative mx-auto max-w-md">
      {STEPS.map((step, index) => (
        <li key={step.label} className="relative flex items-stretch gap-4">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span
              className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                step.accent
                  ? "border-[var(--color-orange)] bg-[var(--color-orange)]"
                  : "border-[var(--text)] bg-[var(--ground)]"
              }`}
            />
            {index < STEPS.length - 1 ? (
              <span className="w-px flex-1 bg-[var(--line)]" aria-hidden="true" />
            ) : null}
          </div>
          <p
            className={`pb-6 font-mono text-sm font-bold tracking-wider ${
              "terminal" in step && step.terminal
                ? "text-2xl text-[var(--color-orange)]"
                : step.accent
                  ? "text-[var(--color-orange)]"
                  : "text-[var(--text)]"
            }`}
          >
            {step.label}
          </p>
        </li>
      ))}
    </ol>
  );
}
