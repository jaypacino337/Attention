/**
 * The Attention mark: a wireframe globe with an orbit ring and an orange node.
 * Inline SVG so it inherits colour and stays crisp at every size.
 */
export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none">
      <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="5" />
      <ellipse cx="50" cy="50" rx="15" ry="34" stroke="currentColor" strokeWidth="4" />
      <path d="M16 50h68M22 32h56M22 68h56" stroke="currentColor" strokeWidth="4" />
      <ellipse
        cx="50"
        cy="50"
        rx="46"
        ry="17"
        stroke="currentColor"
        strokeWidth="5"
        transform="rotate(-18 50 50)"
      />
      <circle cx="72" cy="38" r="9" fill="var(--color-orange)" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Larger hero treatment with the lime satellite from the brand banner. */
export function MarkHero({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 220" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="1.25" opacity="0.9">
        <circle cx="132" cy="108" r="72" />
        <ellipse cx="132" cy="108" rx="30" ry="72" />
        <ellipse cx="132" cy="108" rx="55" ry="72" />
        <path d="M60 108h144M72 72h120M72 144h120" />
      </g>
      <ellipse
        cx="132"
        cy="108"
        rx="104"
        ry="34"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(-16 132 108)"
      />
      <g className="orbit-ring">
        <ellipse
          cx="132"
          cy="108"
          rx="112"
          ry="44"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="3 6"
          opacity="0.65"
        />
        <circle cx="244" cy="108" r="4" fill="var(--color-orange)" />
      </g>
      <g stroke="var(--color-orange)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        <path d="M56 40c-8 5-13 13-14 22" />
        <path d="M46 32c-11 7-18 18-19 30" />
      </g>
      <circle cx="132" cy="108" r="9" fill="var(--color-orange)" className="orbit-node" />
      <circle cx="228" cy="82" r="6" fill="var(--color-lime)" className="node-blink" />
      <circle cx="34" cy="140" r="6" fill="currentColor" className="node-blink-slow" />
      <circle cx="176" cy="52" r="2.5" fill="currentColor" className="node-blink" opacity="0.7" />
      <circle cx="80" cy="168" r="2.5" fill="var(--color-orange)" className="node-blink-slow" />
    </svg>
  );
}
