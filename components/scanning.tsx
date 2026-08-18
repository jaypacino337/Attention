/**
 * The canonical scanning state, styled after the brand banner: a dark
 * terminal panel with a glowing attention globe — wireframe sphere, orange
 * orbit paths, haloed nodes, radiating signal lines, rotating sweep — plus
 * HUD corner labels and bracketed platform chips.
 *
 * The panel is deliberately dark in BOTH themes (it reads as a screen inside
 * the page, financial-terminal style). No fabricated numbers: the HUD labels
 * state what the system is doing, never invented counts.
 */

const INK = "#0e0c0b";
const LIGHT = "rgba(244,242,238,0.75)";
const LIGHT_FAINT = "rgba(244,242,238,0.38)";
const GRID = "rgba(244,242,238,0.055)";

function ScanGlobe({ compact }: { compact: boolean }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className={compact ? "h-32 w-32" : "h-56 w-56 sm:h-64 sm:w-64"}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <radialGradient id="scan-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-orange)" stopOpacity="0.7" />
          <stop offset="40%" stopColor="var(--color-orange)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-orange)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Core glow */}
      <circle cx="120" cy="120" r="58" fill="url(#scan-core)" />

      {/* Wireframe globe */}
      <g stroke={LIGHT} strokeWidth="0.8">
        <circle cx="120" cy="120" r="64" />
        <ellipse cx="120" cy="120" rx="24" ry="64" opacity="0.8" />
        <ellipse cx="120" cy="120" rx="46" ry="64" opacity="0.7" />
        <path d="M56 120h128M63 90h114M63 150h114M76 66h88M76 174h88" opacity="0.7" />
      </g>
      <circle
        cx="120"
        cy="120"
        r="71"
        stroke={LIGHT_FAINT}
        strokeWidth="0.7"
        strokeDasharray="1 4"
      />

      {/* Orbit paths, slow counter-drift */}
      <g className="scan-rotate-slow">
        <ellipse
          cx="120"
          cy="120"
          rx="104"
          ry="36"
          stroke="var(--color-orange)"
          strokeWidth="1"
          opacity="0.75"
          transform="rotate(-16 120 120)"
        />
        <ellipse
          cx="120"
          cy="120"
          rx="110"
          ry="50"
          stroke={LIGHT}
          strokeWidth="0.7"
          strokeDasharray="2 5"
          opacity="0.5"
          transform="rotate(22 120 120)"
        />
        <ellipse
          cx="120"
          cy="120"
          rx="90"
          ry="74"
          stroke="var(--color-orange)"
          strokeWidth="0.7"
          strokeDasharray="1 6"
          opacity="0.45"
          transform="rotate(62 120 120)"
        />
      </g>

      {/* Radiating signal lines */}
      <g stroke="var(--color-orange)" strokeWidth="0.8" opacity="0.5">
        <path d="M120 120L30 92M120 120L204 72M120 120L64 196M120 120L196 174M120 120L112 24M120 120L48 44" />
      </g>

      {/* Attention nodes with halos */}
      <g>
        <g className="node-blink">
          <circle cx="30" cy="92" r="4" fill="var(--color-orange)" />
          <circle cx="30" cy="92" r="7.5" stroke="var(--color-orange)" opacity="0.5" />
        </g>
        <g className="node-blink-slow">
          <circle cx="204" cy="72" r="5" fill="var(--color-orange)" />
          <circle cx="204" cy="72" r="9" stroke="var(--color-orange)" opacity="0.5" />
        </g>
        <g className="node-blink">
          <circle cx="64" cy="196" r="3.5" fill="var(--color-orange)" />
          <circle cx="64" cy="196" r="6.5" stroke="var(--color-orange)" opacity="0.45" />
        </g>
        <g className="node-blink-slow">
          <circle cx="196" cy="174" r="4" fill="var(--color-orange)" />
          <circle cx="196" cy="174" r="7.5" stroke="var(--color-orange)" opacity="0.5" />
        </g>
        <circle cx="112" cy="24" r="3" fill="var(--color-orange)" className="node-blink" />
        <circle cx="48" cy="44" r="3" fill="var(--color-orange)" className="node-blink-slow" />
        <circle cx="86" cy="58" r="2" fill="var(--color-orange)" opacity="0.85" />
        <circle cx="168" cy="128" r="2.5" fill="var(--color-orange)" opacity="0.85" />
        <circle cx="140" cy="200" r="2" fill={LIGHT} opacity="0.7" />
        <circle cx="216" cy="140" r="1.8" fill={LIGHT} opacity="0.6" />
        <g className="node-blink">
          <circle cx="158" cy="206" r="4" fill="var(--color-lime)" />
          <circle cx="158" cy="206" r="7.5" stroke="var(--color-lime)" opacity="0.5" />
        </g>
      </g>

      {/* Rotating sweep */}
      <g className="scan-rotate">
        <path d="M120 120L120 14" stroke="var(--color-orange)" strokeWidth="1.2" opacity="0.65" />
        <circle cx="120" cy="14" r="3.5" fill="var(--color-orange)" />
      </g>

      {/* Core: ringed, glowing, pulsing */}
      <circle cx="120" cy="120" r="15" stroke="var(--color-orange)" strokeWidth="1.2" opacity="0.8" />
      <circle cx="120" cy="120" r="9" fill="var(--color-orange)" className="orbit-node" />
      <circle cx="120" cy="120" r="3.5" fill="#ffd9c4" />
    </svg>
  );
}

const CHIPS = [
  { label: "X", className: "left-2 top-[16%]" },
  { label: "FOMO", className: "right-2 top-[9%]" },
  { label: "PUMP.FUN", className: "bottom-[16%] left-2" },
  { label: "SCANNER", className: "bottom-[9%] right-2", lime: true },
] as const;

function Chip({ label, lime = false }: { label: string; lime?: boolean }) {
  return (
    <span
      className="flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] font-bold tracking-widest"
      style={{
        borderColor: "rgba(244,242,238,0.28)",
        background: "rgba(14,12,11,0.82)",
        color: "rgba(244,242,238,0.92)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: lime ? "var(--color-lime)" : "var(--color-orange)" }}
      />
      {label}
    </span>
  );
}

/** Small crosshair mark, banner-style. */
function Cross({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute font-mono text-[10px] ${className}`}
      style={{ color: LIGHT_FAINT }}
    >
      +
    </span>
  );
}

export function Scanning({
  title = "Scanning for attention",
  line = "Live signals appear here as they are detected.",
  compact = false,
}: {
  title?: string;
  line?: string;
  compact?: boolean;
}) {
  const grid = {
    background: INK,
    backgroundImage: `linear-gradient(to right, ${GRID} 1px, transparent 1px), linear-gradient(to bottom, ${GRID} 1px, transparent 1px)`,
    backgroundSize: "36px 36px",
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center px-4 py-5 text-center" style={grid}>
        <ScanGlobe compact />
        <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest" style={{ color: "rgba(244,242,238,0.92)" }}>
          {title}
        </p>
        <p className="mt-1 max-w-sm text-xs" style={{ color: LIGHT }}>
          {line}
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden px-4 py-8 text-center sm:px-6" style={grid}>
      <Cross className="left-3 top-2" />
      <Cross className="right-3 top-2" />
      <Cross className="bottom-2 left-3" />

      {/* HUD corner labels */}
      <div className="absolute left-4 top-4 hidden text-left sm:block">
        <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: LIGHT_FAINT }}>
          Attention flow
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-orange)]">
          <span className="node-blink h-1.5 w-1.5 rounded-full bg-[var(--color-orange)]" />
          scanning
        </p>
      </div>
      <div className="absolute right-4 top-4 hidden text-right sm:block">
        <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: LIGHT_FAINT }}>
          Tracking attention
        </p>
        <p className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[var(--color-orange)]">
          rewarding value
        </p>
      </div>

      <div className="relative mx-auto inline-block px-12 py-2">
        <ScanGlobe compact={false} />
        {CHIPS.map((chip) => (
          <span key={chip.label} className={`absolute ${chip.className}`}>
            <Chip label={chip.label} lime={"lime" in chip && chip.lime} />
          </span>
        ))}
      </div>

      <p
        className="mt-4 font-mono text-xs font-bold uppercase tracking-widest"
        style={{ color: "rgba(244,242,238,0.94)" }}
      >
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm" style={{ color: LIGHT }}>
        {line}
      </p>
    </div>
  );
}
