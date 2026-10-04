import { NextResponse } from "next/server";
import { getTerminalFeed } from "@/lib/terminal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public terminal feed (rewards need no wallet connect, so there is no gate). */
export async function GET() {
  return NextResponse.json({ feed: await getTerminalFeed() });
}
