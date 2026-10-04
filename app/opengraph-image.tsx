import { ImageResponse } from "next/og";

export const alt = "Attention Markets: attention pays";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f1ede3", padding: 64, border: "16px solid #0c0c0c", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 4 }}>$ATTENTION · SOLANA</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.9 }}>
          <div style={{ fontSize: 190, fontWeight: 900, color: "#0c0c0c", letterSpacing: -8 }}>ATTENTION</div>
          <div style={{ fontSize: 190, fontWeight: 900, color: "#1f3cff", letterSpacing: -8 }}>PAYS.</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>50% holders · 40% 𝕏 callers · 10% burn · nothing to claim</div>
      </div>
    ),
    size,
  );
}
