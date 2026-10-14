import { NextResponse } from "next/server";
import { SwapError, mintInfo, quote, toBaseUnits } from "@/lib/swap";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  try {
    const inputMint = p.get("in") ?? "";
    const outputMint = p.get("out") ?? "";
    const slippageBps = Math.min(Math.max(Number(p.get("slippageBps") ?? 50) || 50, 10), 1000);
    const [inp, out] = await Promise.all([mintInfo(inputMint), mintInfo(outputMint)]);
    const q = await quote(inputMint, outputMint, toBaseUnits(p.get("amount") ?? "", inp.decimals), slippageBps);
    const ui = (raw: string, d: number) => Number(raw) / 10 ** d;
    return NextResponse.json({
      out: ui(q.outAmount, out.decimals),
      minOut: ui(q.otherAmountThreshold, out.decimals),
      priceImpactPct: Number(q.priceImpactPct) * 100,
      via: [...new Set(q.routePlan.map((s) => s.swapInfo.label))].slice(0, 3),
      inDecimals: inp.decimals,
      outDecimals: out.decimals,
    });
  } catch (e) {
    const message = e instanceof SwapError ? e.message : "Quotes are unavailable right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
