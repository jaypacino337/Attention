import { NextResponse } from "next/server";
import { SwapError, buildSwapToTx, mintInfo, toBaseUnits } from "@/lib/swap";

export const dynamic = "force-dynamic";

/** Builds an unsigned swap-to-recipient transaction. Nothing is signed or sent here. */
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const inp = await mintInfo(String(b.inputMint ?? ""));
    const slippageBps = Math.min(Math.max(Number(b.slippageBps ?? 50) || 50, 10), 1000);
    const built = await buildSwapToTx({
      user: String(b.user ?? ""),
      recipient: String(b.recipient ?? ""),
      inputMint: String(b.inputMint),
      outputMint: String(b.outputMint ?? ""),
      amount: toBaseUnits(String(b.amount ?? ""), inp.decimals),
      slippageBps,
    });
    return NextResponse.json(built);
  } catch (e) {
    const message = e instanceof SwapError ? e.message : "Could not build the swap right now.";
    if (!(e instanceof SwapError)) console.error("swap build", e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
