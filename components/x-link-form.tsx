"use client";

import { useState } from "react";
import { useWallet } from "./wallet-context";

/** Bind an X handle to the connected wallet, so social rewards have a payee. */
export function XLinkForm() {
  const { account, refresh } = useWallet();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!account) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/x/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not link that account");
      setHandle("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not link that account");
    } finally {
      setBusy(false);
    }
  }

  async function unlink() {
    setBusy(true);
    await fetch("/api/x/link", { method: "DELETE" });
    await refresh();
    setBusy(false);
  }

  if (account.xLink) {
    return (
      <div className="border rule bg-[var(--ground-raised)] p-6">
        <p className="label">Linked X account</p>
        <p className="mt-2 text-2xl font-bold">@{account.xLink.handle}</p>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          {account.xLink.verified
            ? "Verified — this account earns from the social pool."
            : "Claimed but not yet verified. Verification is required before social rewards pay out."}
        </p>
        <button
          type="button"
          onClick={() => void unlink()}
          disabled={busy}
          className="mt-4 border px-3 py-2 text-sm font-semibold rule hover:border-[var(--color-orange)] disabled:opacity-60"
        >
          Unlink
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border rule bg-[var(--ground-raised)] p-6">
      <p className="label">Link your X</p>
      <p className="mt-2 text-sm text-[var(--text-soft)]">
        Your posts earn from the 30% social pool. Linking binds the handle to this wallet so the
        payout has somewhere to land.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex flex-1 items-center border rule bg-[var(--ground)] px-3">
          <span className="text-[var(--text-faint)]">@</span>
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="yourhandle"
            aria-label="X handle"
            className="w-full bg-transparent px-2 py-2 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !handle.trim()}
          className="bg-[var(--color-orange)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Linking…" : "Link"}
        </button>
      </div>

      {!account.eligible ? (
        <p className="mt-3 text-sm text-[var(--text-soft)]">
          You&apos;ll need {account.thresholds.eligible.toLocaleString()} ATTENTION before a link
          can earn.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 border-l-2 border-[var(--color-orange)] pl-3 text-sm">{error}</p>
      ) : null}
    </form>
  );
}
