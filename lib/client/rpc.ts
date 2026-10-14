/** Browser-side JSON-RPC through our /api/rpc relay (the RPC key stays server-side). */
let id = 0;
export async function rpc<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
  const r = await fetch("/api/rpc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const body = await r.json().catch(() => ({}));
  if (body.error) throw new Error(typeof body.error === "string" ? body.error : body.error.message ?? "RPC error");
  return body.result as T;
}

export const getBalance = async (address: string) =>
  BigInt((await rpc<{ value: number }>("getBalance", [address, { commitment: "confirmed" }])).value);

export async function getTokenBalance(owner: string, mint: string): Promise<number> {
  const r = await rpc<{ value: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number | null } } } } } }[] }>(
    "getTokenAccountsByOwner",
    [owner, { mint }, { encoding: "jsonParsed", commitment: "confirmed" }],
  );
  return r.value.reduce((s, a) => s + (a.account.data.parsed.info.tokenAmount.uiAmount ?? 0), 0);
}

export const latestBlockhash = async () =>
  (await rpc<{ value: { blockhash: string; lastValidBlockHeight: number } }>("getLatestBlockhash", [{ commitment: "confirmed" }])).value;

const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};

export async function simulate(tx: Uint8Array) {
  const r = await rpc<{ value: { err: unknown; logs: string[] | null } }>("simulateTransaction", [
    b64(tx),
    { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true, commitment: "confirmed" },
  ]);
  return r.value;
}

/** Broadcast a fully signed transaction and wait until it is confirmed. */
export async function sendAndConfirm(tx: Uint8Array, lastValidBlockHeight?: number): Promise<string> {
  const sig = await rpc<string>("sendTransaction", [b64(tx), { encoding: "base64", maxRetries: 5, preflightCommitment: "confirmed" }]);
  const started = Date.now();
  while (Date.now() - started < 90_000) {
    await new Promise((r) => setTimeout(r, 1500));
    const s = await rpc<{ value: ({ err: unknown; confirmationStatus?: string } | null)[] }>("getSignatureStatuses", [[sig]]);
    const st = s.value[0];
    if (st?.err) throw new Error("The transaction failed on-chain. Nothing moved.");
    if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) return sig;
    // resend while waiting; Solana drops duplicates
    if ((Date.now() - started) % 6000 < 1600) await rpc("sendTransaction", [b64(tx), { encoding: "base64", skipPreflight: true, maxRetries: 0 }]).catch(() => {});
  }
  void lastValidBlockHeight;
  throw new Error(`Not confirmed yet. Check it on Solscan: ${sig}`);
}

export function explainSimError(err: unknown, logs: string[] | null): string {
  const text = JSON.stringify(err) + (logs ?? []).join("\n");
  if (/insufficient lamports|InsufficientFunds|insufficient funds|Custom":1\b/i.test(text)) return "Not enough SOL to cover the amount and network fees.";
  if (/InsufficientFundsForRent/.test(text)) return "The recipient is a new wallet: send at least 0.001 SOL so it can exist on-chain.";
  if (/AccountNotFound/.test(text)) return "Your wallet has no SOL on mainnet yet.";
  return "This transaction would fail right now, so nothing was sent.";
}
