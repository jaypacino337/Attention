import { LINKS } from "@/lib/config";
import { getTokenStats } from "@/lib/pumpfun";

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(2)}`;

/**
 * Live pump.fun stats strip. Server component: renders nothing at all when
 * the mint isn't configured or the API doesn't answer — no fake zeros, no
 * loading spinners on a landing page.
 */
export async function TokenStats() {
  const stats = await getTokenStats();
  if (!stats || stats.marketCapUsd === null) return null;

  const items: Array<{ label: string; value: string }> = [
    { label: "Market cap", value: usd(stats.marketCapUsd) },
  ];
  if (stats.priceUsd !== null) {
    items.push({ label: "Price", value: `$${stats.priceUsd.toFixed(8)}` });
  }
  if (stats.replies !== null) {
    items.push({ label: "pump.fun replies", value: stats.replies.toLocaleString("en-US") });
  }
  if (stats.graduated !== null) {
    items.push({ label: "Curve", value: stats.graduated ? "Graduated" : "Bonding" });
  }

  return (
    <div className="border-b rule bg-[var(--ground-raised)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-lime)]" />
          <span className="label">Live</span>
        </span>
        {items.map((item) => (
          <span key={item.label} className="flex items-baseline gap-2 text-sm">
            <span className="text-[var(--text-faint)]">{item.label}</span>
            <span className="font-mono font-bold">{item.value}</span>
          </span>
        ))}
        {LINKS.pumpfun ? (
          <a
            href={LINKS.pumpfun}
            className="ml-auto text-sm font-semibold text-[var(--color-orange)] underline underline-offset-4"
          >
            Trade →
          </a>
        ) : null}
      </div>
    </div>
  );
}
