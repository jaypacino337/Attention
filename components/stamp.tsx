/** Spinning circular "sticker" stamp. Pure SVG + CSS; still under reduced motion. */
export function Stamp({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`relative grid aspect-square place-items-center rounded-full border-2 border-ink bg-cobalt text-white shadow-[4px_4px_0_0_var(--color-ink)] ${className}`} aria-hidden>
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full">
        <defs>
          <path id="stamp-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text fill="currentColor" style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, letterSpacing: 3.2 }}>
          <textPath href="#stamp-circle">{text}</textPath>
        </text>
      </svg>
      <span className="display text-4xl">✺</span>
    </div>
  );
}
