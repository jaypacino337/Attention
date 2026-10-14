"use client";

import { useEffect, useRef } from "react";

/**
 * A slow field of hex ciphertext behind the hero. Columns drift and a soft
 * "spotlight" near the cursor decrypts characters to brighter cyan. Pure
 * canvas, paused when off-screen or when reduced motion is requested.
 */
export function CipherField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const HEX = "0123456789abcdef";
    const cell = 18;
    let w = 0, h = 0, cols = 0, rows = 0;
    let grid: string[] = [];
    let offsets: number[] = [];
    let mouse = { x: -9999, y: -9999 };
    let visible = true;
    let raf = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / cell) + 1;
      rows = Math.ceil(h / cell) + 2;
      grid = Array.from({ length: cols * rows }, () => HEX[(Math.random() * 16) | 0]);
      offsets = Array.from({ length: cols }, () => Math.random() * cell);
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || t - last < 60) return;
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.font = "11px ui-monospace, Menlo, monospace";
      for (let c = 0; c < cols; c++) {
        offsets[c] = (offsets[c] + 0.35 + (c % 3) * 0.12) % cell;
        for (let r = 0; r < rows; r++) {
          const i = r * cols + c;
          if (Math.random() < 0.004) grid[i] = HEX[(Math.random() * 16) | 0];
          const x = c * cell;
          const y = r * cell + offsets[c] - cell;
          const d = Math.hypot(x - mouse.x, y - mouse.y);
          const near = Math.max(0, 1 - d / 160);
          const fade = 0.07 + near * 0.55;
          ctx.fillStyle = near > 0.05 ? `rgba(47,214,198,${fade})` : `rgba(167,176,182,${fade})`;
          ctx.fillText(grid[i], x, y);
        }
      }
    };

    resize();
    if (reduce) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
