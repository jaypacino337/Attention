import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/account";
import { removeLink, setLink } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bind an X handle to the session wallet.
 *
 * The handle is stored `verified: false`. Self-declaring a handle proves
 * nothing — anyone could claim a big account — so social rewards must only
 * ever pay links that the X OAuth callback has marked verified. See
 * README "X verification" for the remaining step.
 */
export async function POST(request: Request) {
  const account = await loadAccount();
  if (!account) return NextResponse.json({ error: "Connect your wallet first" }, { status: 401 });

  if (!account.eligible) {
    return NextResponse.json(
      {
        error: `Hold at least ${account.thresholds.eligible.toLocaleString()} ATTENTION to link an X account.`,
      },
      { status: 403 },
    );
  }

  let handle: unknown;
  try {
    ({ handle } = await request.json());
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }
  if (typeof handle !== "string") {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  const result = await setLink(account.wallet, handle, false);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });

  return NextResponse.json({ ok: true, link: result.link });
}

export async function DELETE() {
  const account = await loadAccount();
  if (!account) return NextResponse.json({ error: "Connect your wallet first" }, { status: 401 });

  await removeLink(account.wallet);
  return NextResponse.json({ ok: true });
}
