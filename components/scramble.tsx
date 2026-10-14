"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789abcdef#%&@$*+=<>/\\|";

/**
 * Text that "decrypts": every character starts as ciphertext and locks into
 * place left to right. Renders the final text for screen readers and when the
 * visitor prefers reduced motion.
 */
export function Scramble({ text, className, delay = 0, speed = 28 }: { text: string; className?: string; delay?: number; speed?: number }) {
  const [shown, setShown] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let raf = 0;
    const total = text.length * 3 + 12;
    const tick = () => {
      frame++;
      const locked = Math.floor((frame - 6) / 3);
      setShown(
        text
          .split("")
          .map((ch, i) => (ch === " " || i < locked ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join(""),
      );
      if (frame < total) raf = window.setTimeout(tick, speed) as unknown as number;
      else setShown(text);
    };
    const start = window.setTimeout(tick, delay);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(raf);
    };
  }, [text, delay, speed]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
