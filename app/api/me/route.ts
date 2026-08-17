import { NextResponse } from "next/server";
import { loadAccount } from "@/lib/account";

export const runtime = "nodejs";
/** Balance is live per request — never cache this at the edge. */
export const dynamic = "force-dynamic";

export async function GET() {
  const account = await loadAccount();
  if (!account) return NextResponse.json({ authenticated: false }, { status: 200 });
  return NextResponse.json({ authenticated: true, account });
}
