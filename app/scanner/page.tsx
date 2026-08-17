import type { Metadata } from "next";
import { ScannerTable } from "@/components/scanner-table";
import { SCANNER_STATUSES, loadScannerCalls } from "@/lib/scanner";

export const metadata: Metadata = {
  title: "Attention Scanner",
  description: "Where is attention going next? The scanner's permanent public record.",
};
export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const calls = await loadScannerCalls();
  const open = calls.filter((call) => call.status !== "CLOSED");
  const closed = calls.filter((call) => call.status === "CLOSED");

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <p className="label">Intelligence layer</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">
        Attention <span className="serif-italic font-normal">Scanner</span>
      </h1>
      <p className="mt-3 text-lg font-bold text-[var(--color-orange)]">
        Where is attention going next?
      </p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)]">
        The scanner surfaces emerging tokens, memes, narratives, creators and trends across
        pump.fun, FOMO and X. Every call is published to a permanent record — bad calls are closed,
        never deleted.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SCANNER_STATUSES.map((status) => (
          <span
            key={status}
            className="border rule px-2 py-1 font-mono text-[10px] font-bold tracking-wider text-[var(--text-soft)]"
          >
            {status}
            <span className="ml-1.5 text-[var(--color-orange)]">
              {calls.filter((call) => call.status === status).length}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest">Active calls</h2>
          <span className="label">{open.length} open</span>
        </div>
        <ScannerTable calls={open} numbered />
      </div>

      {closed.length > 0 ? (
        <div className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest">
              Closed — the record stands
            </h2>
            <span className="label">{closed.length} closed</span>
          </div>
          <ScannerTable calls={closed} />
        </div>
      ) : null}
    </section>
  );
}
