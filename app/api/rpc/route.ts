import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Narrow JSON-RPC relay for the Send and Swap pages, so the RPC key in
 * SOLANA_RPC_URL stays on the server. Only the read, simulate and broadcast
 * calls those pages need are allowed through.
 */
const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const ALLOWED = new Set([
  "getLatestBlockhash",
  "getBalance",
  "getMultipleAccounts",
  "getAccountInfo",
  "getTokenAccountsByOwner",
  "getSignatureStatuses",
  "simulateTransaction",
  "sendTransaction",
  "getMinimumBalanceForRentExemption",
]);

export async function POST(req: Request) {
  let body: { method?: string } | { method?: string }[];
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const calls = Array.isArray(body) ? body : [body];
  if (calls.length > 5 || calls.some((c) => !c || !ALLOWED.has(String(c.method)))) {
    return NextResponse.json({ error: "method not allowed" }, { status: 403 });
  }
  const r = await fetch(RPC_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
}
