/**
 * The one canonical empty state: an active system scanning for signal, not an
 * apology for missing data.
 *
 * The visual follows the brand banner: a wireframe globe with a glowing
 * orange core, orbit paths and attention nodes radiating outward, a rotating
 * sweep, and bracketed platform chips (X / FOMO / PUMP.FUN / SCANNER).
 * Drawn in currentColor + brand tokens so it reads in light and dark.
 */

function ScanGlobe({ compact }: { compact: boolean }) {
  return (
    <svg
      viewBox="0 0 220 220"
      className={compact ? "h-24 w-24" : "h-44 w-44 sm:h-52 sm:w-52"}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id="scan-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-orange)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--color-orange)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-orange)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Core glow */}
      <circle cx="110" cy="110" r="46" fill="url(#scan-core)" />

      {/* Wireframe globe */}
      <g stroke="currentColor" strokeWidth="0.9" opacity="0.75">
        <circle cx="110" cy="110" r="62" />
        <ellipse cx="110" cy="110" rx="24" ry="62" />
        <ellipse cx="110" cy="110" rx="46" ry="62" />
        <path d="M48 110h124M56 80h108M56 140h108" />
      </g>

      {/* Orbit paths (slow counter-drift) */}
      <g className="scan-rotate-slow">
        <ellipse
          cx="110"
          cy="110"
          rx="94"
          ry="34"
          stroke="var(--color-orange)"
          strokeWidth="0.9"
          opacity="0.55"
          transform="rotate(-18 110 110)"
        />
        <ellipse
          cx="110"
          cy="110"
          rx="100"
          ry="46"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 5"
          opacity="0.5"
          transform="rotate(24 110 110)"
        />
        <ellipse
          cx="110"
          cy="110"
          rx="82"
          ry="70"
          stroke="var(--color-orange)"
          strokeWidth="0.7"
          strokeDasharray="1 6"
          opacity="0.4"
          transform="rotate(64 110 110)"
        />
      </g>

      {/* Radiating attention lines */}
      <g stroke="var(--color-orange)" strokeWidth="0.7" opacity="0.35">
        <path d="M110 110L28 84M110 110L186 66M110 110L58 178M110 110L178 160M110 110L104 22" />
      </g>

      {/* Attention nodes */}
      <g fill="var(--color-orange)">
        <circle cx="28" cy="84" r="4" className="node-blink" />
        <circle cx="186" cy="66" r="5" className="node-blink-slow" />
        <circle cx="58" cy="178" r="3.5" className="node-blink" />
        <circle cx="178" cy="160" r="4" className="node-blink-slow" />
        <circle cx="104" cy="22" r="3" className="node-blink" />
        <circle cx="70" cy="52" r="2.5" opacity="0.8" />
        <circle cx="160" cy="120" r="2.5" opacity="0.8" />
      </g>
      <circle cx="146" cy="188" r="4" fill="var(--color-lime)" className="node-blink" />

      {/* Rotating sweep */}
      <g className="scan-rotate">
        <path d="M110 110L110 12" stroke="var(--color-orange)" strokeWidth="1.2" opacity="0.6" />
        <circle cx="110" cy="12" r="3.5" fill="var(--color-orange)" />
      </g>

      {/* Core */}
      <circle cx="110" cy="110" r="10" fill="var(--color-orange)" className="orbit-node" />
      <circle cx="110" cy="110" r="4" fill="var(--ground)" opacity="0.9" />
      <circle cx="110" cy="110" r="2.5" fill="var(--color-orange)" />
    </svg>
  );
}

const CHIPS = [
  { label: "X", className: "left-0 top-[12%]" },
  { label: "FOMO", className: "right-0 top-[6%]" },
  { label: "PUMP.FUN", className: "bottom-[10%] left-0" },
  { label: "SCANNER", className: "bottom-[4%] right-0", lime: true },
] as const;

export function Scanning({
  title = "Scanning for attention",
  line = "Live signals appear here as they are detected.",
  compact = false,
}: {
  title?: string;
  line?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-6" : "px-6 py-10"}`}
    >
      <div className={`relative ${compact ? "" : "px-10 py-3"}`}>
        <ScanGlobe compact={compact} />
        {!compact
          ? CHIPS.map((chip) => (
              <span key={chip.label} className={`absolute ${chip.className}`}>
                <span className="bracket flex items-center gap-1.5 border rule bg-[var(--ground)]/85 px-2 py-1 font-mono text-[9px] font-bold tracking-widest">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${"lime" in chip && chip.lime ? "bg-[var(--color-lime)]" : "bg-[var(--color-orange)]"}`}
                  />
                  {chip.label}
                </span>
              </span>
            ))
          : null}
      </div>
      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-[var(--text-soft)]">{line}</p>
      <p className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[var(--text-faint)]">
        <span className="node-blink h-1.5 w-1.5 rounded-full bg-[var(--color-orange)]" />
        attention flow
      </p>
    </div>
  );
}
