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

/**
 * Hero globe, in the brand banner's language: dense wireframe sphere with a
 * glowing pulsing core, four orbital paths on different axes, and orange
 * attention nodes TRAVELING those orbits (SMIL animateMotion along the real
 * elliptical paths — no distorted transform tricks). Static haloed nodes
 * carry the composition when reduced-motion hides the travelers.
 *
 * Orbit paths are ellipses expressed as arc pairs with x-axis-rotation, so
 * motion paths and drawn paths are the exact same geometry.
 */
export function MarkHero({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 260" className={className} aria-hidden="true" fill="none">
      <defs>
        <radialGradient id="hero-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-orange)" stopOpacity="0.5" />
          <stop offset="45%" stopColor="var(--color-orange)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--color-orange)" stopOpacity="0" />
        </radialGradient>
        {/* Orbit geometry — drawn below and reused as motion paths. */}
        <path id="hero-orbit-a" d="M263.4 97.5 A118 42 -16 1 1 36.6 162.5 A118 42 -16 1 1 263.4 97.5 Z" />
        <path id="hero-orbit-b" d="M265.1 181.2 A126 56 24 1 1 34.9 78.8 A126 56 24 1 1 265.1 181.2 Z" />
        <path id="hero-orbit-c" d="M195.4 219.1 A100 80 63 1 1 104.6 40.9 A100 80 63 1 1 195.4 219.1 Z" />
        <path id="hero-orbit-d" d="M217.4 73.4 A88 30 -40 1 1 82.6 186.6 A88 30 -40 1 1 217.4 73.4 Z" />
      </defs>

      {/* Core glow */}
      <circle cx="150" cy="130" r="62" fill="url(#hero-core)" />

      {/* Wireframe sphere */}
      <g stroke="currentColor" strokeWidth="1">
        <circle cx="150" cy="130" r="76" />
        <ellipse cx="150" cy="130" rx="28" ry="76" opacity="0.85" />
        <ellipse cx="150" cy="130" rx="54" ry="76" opacity="0.7" />
        <path d="M74 130h152M82 96h136M82 164h136M98 68h104M98 192h104" opacity="0.75" />
      </g>
      <circle
        cx="150"
        cy="130"
        r="84"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="1 5"
        opacity="0.5"
      />

      {/* Orbit paths on four axes */}
      <use href="#hero-orbit-a" stroke="var(--color-orange)" strokeWidth="1.1" opacity="0.8" />
      <use
        href="#hero-orbit-b"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="3 6"
        opacity="0.55"
      />
      <use
        href="#hero-orbit-c"
        stroke="var(--color-orange)"
        strokeWidth="0.8"
        strokeDasharray="1 6"
        opacity="0.55"
      />
      <use
        href="#hero-orbit-d"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 5"
        opacity="0.45"
      />

      {/* Radiating signal lines to fixed nodes */}
      <g stroke="var(--color-orange)" strokeWidth="0.8" opacity="0.4">
        <path d="M150 130L56 70M150 130L246 190M150 130L142 30" />
      </g>

      {/* Signal arcs — brand accent */}
      <g stroke="var(--color-orange)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9">
        <path d="M60 38c-8 5-13 13-14 22" />
        <path d="M50 30c-11 7-18 18-19 30" />
      </g>

      {/* Static haloed nodes (remain under reduced motion) */}
      <g className="node-blink">
        <circle cx="56" cy="70" r="4" fill="var(--color-orange)" />
        <circle cx="56" cy="70" r="7.5" stroke="var(--color-orange)" opacity="0.5" />
      </g>
      <g className="node-blink-slow">
        <circle cx="246" cy="190" r="4.5" fill="var(--color-orange)" />
        <circle cx="246" cy="190" r="8" stroke="var(--color-orange)" opacity="0.5" />
      </g>
      <circle cx="142" cy="30" r="3" fill="var(--color-orange)" className="node-blink" />
      <circle cx="252" cy="96" r="6" fill="var(--color-lime)" className="node-blink-slow" />
      <circle cx="44" cy="170" r="5" fill="currentColor" className="node-blink" />
      <circle cx="196" cy="222" r="2.5" fill="currentColor" opacity="0.6" />
      <circle cx="94" cy="46" r="2" fill="var(--color-orange)" opacity="0.8" />

      {/* Attention nodes traveling the orbits */}
      <g className="motion-only">
        <g>
          <circle r="5.5" fill="var(--color-orange)" />
          <circle r="9.5" stroke="var(--color-orange)" opacity="0.5" fill="none" />
          <animateMotion dur="16s" repeatCount="indefinite" rotate="0">
            <mpath href="#hero-orbit-a" />
          </animateMotion>
        </g>
        <g>
          <circle r="4" fill="var(--color-orange)" />
          <animateMotion
            dur="26s"
            repeatCount="indefinite"
            keyPoints="1;0"
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href="#hero-orbit-b" />
          </animateMotion>
        </g>
        <g>
          <circle r="3.5" fill="var(--color-orange)" />
          <circle r="6.5" stroke="var(--color-orange)" opacity="0.45" fill="none" />
          <animateMotion dur="34s" repeatCount="indefinite">
            <mpath href="#hero-orbit-c" />
          </animateMotion>
        </g>
        <g>
          <circle r="3" fill="currentColor" />
          <animateMotion
            dur="11s"
            repeatCount="indefinite"
            keyPoints="1;0"
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href="#hero-orbit-d" />
          </animateMotion>
        </g>
        <g>
          <circle r="2.5" fill="var(--color-orange)" opacity="0.9" />
          <animateMotion dur="21s" begin="-8s" repeatCount="indefinite">
            <mpath href="#hero-orbit-a" />
          </animateMotion>
        </g>
      </g>

      {/* Core: ringed, pulsing, bright center */}
      <circle cx="150" cy="130" r="16" stroke="var(--color-orange)" strokeWidth="1.2" opacity="0.75" />
      <circle cx="150" cy="130" r="10" fill="var(--color-orange)" className="orbit-node" />
      <circle cx="150" cy="130" r="4" fill="#ffd9c4" />
    </svg>
  );
}
