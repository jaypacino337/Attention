import type { Metadata } from "next";
import { fundHasData, loadFund } from "@/lib/fund";

export const metadata: Metadata = {
  title: "Attention Fund",
  description: "Trading where attention goes next. Profits and rewards buy back and burn $ATTENTION.",
};
export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");
const sol = (n: number) => `${n >= 0 ? "" : "−"}${fmt(Math.abs(n))} SOL`;
const usd = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;
const date = (iso?: string) => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
};

function Tx({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      className="font-mono text-xs font-bold text-[var(--color-orange)] underline underline-offset-4"
    >
      tx →
    </a>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest">{title}</h2>
        <span className="label">{count}</span>
      </div>
      {count === 0 ? (
        <p className="border border-dashed rule px-5 py-6 text-sm text-[var(--text-soft)]">
          {empty}
        </p>
      ) : (
        <div className="border rule bg-[var(--ground-raised)]">{children}</div>
      )}
    </section>
  );
}

export default async function FundPage() {
  const fund = await loadFund();

  const stats = [
    { label: "Fund value", value: fund.stats.fundValueSol, render: sol },
    { label: "Realized PnL", value: fund.stats.realizedPnlSol, render: sol },
    { label: "Callout rewards", value: fund.stats.calloutRewardsSol, render: sol },
    { label: "Bought back", value: fund.stats.attentionBoughtBack, render: (n: number) => `${fmt(n)} ATTN` },
    { label: "Burned", value: fund.stats.attentionBurned, render: (n: number) => `${fmt(n)} ATTN` },
  ].filter((stat) => typeof stat.value === "number");

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <p className="label">The 10%</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">
        Attention <span className="serif-italic font-normal">Fund</span>
      </h1>
      <p className="mt-3 text-lg font-bold">Trading where attention goes next.</p>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--text-soft)]">
        A portion of creator fees capitalizes the Attention Fund. It trades attention-driven
        opportunities and makes its own callouts; realized profits and callout rewards buy back and
        burn $ATTENTION. Every number here is real and linked to the chain — losses included.
      </p>
      {fund.updatedAt ? <p className="label mt-3">updated {date(fund.updatedAt)}</p> : null}

      {!fundHasData(fund) ? (
        <div className="mt-10 border border-dashed rule px-6 py-14 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-faint)]">
            fund not yet capitalized
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-soft)]">
            The dashboard lights up when the first fees arrive: value, positions, closed trades,
            callouts, buybacks and burns — with explorer links on every transaction.
          </p>
        </div>
      ) : (
        <>
          {stats.length > 0 ? (
            <div className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-5">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-[var(--ground)] p-5">
                  <p className="label">{stat.label}</p>
                  <p className="mt-2 font-mono text-lg font-bold">
                    {stat.render(stat.value as number)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <Section
            title="Open positions"
            count={fund.openPositions.length}
            empty="No open positions."
          >
            {fund.openPositions.map((position, index) => (
              <div
                key={`${position.asset}-${index}`}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${index > 0 ? "border-t rule" : ""}`}
              >
                <span className="text-sm font-bold">
                  {position.asset}
                  {position.ticker ? (
                    <span className="ml-2 font-mono text-xs font-normal text-[var(--text-faint)]">
                      ${position.ticker}
                    </span>
                  ) : null}
                </span>
                {typeof position.sizeSol === "number" ? (
                  <span className="font-mono text-xs">{fmt(position.sizeSol)} SOL</span>
                ) : null}
                {typeof position.entryMcap === "number" ? (
                  <span className="font-mono text-xs text-[var(--text-faint)]">
                    in {usd(position.entryMcap)}
                  </span>
                ) : null}
                {typeof position.currentMcap === "number" ? (
                  <span className="font-mono text-xs">now {usd(position.currentMcap)}</span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {date(position.openedAt) ? (
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      {date(position.openedAt)}
                    </span>
                  ) : null}
                  <Tx url={position.txUrl} />
                </span>
              </div>
            ))}
          </Section>

          <Section title="Closed trades" count={fund.closedTrades.length} empty="No closed trades yet.">
            {fund.closedTrades.map((trade, index) => (
              <div
                key={`${trade.asset}-${index}`}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${index > 0 ? "border-t rule" : ""}`}
              >
                <span className="text-sm font-bold">{trade.asset}</span>
                {typeof trade.pnlSol === "number" ? (
                  <span
                    className={`font-mono text-xs font-bold ${trade.pnlSol >= 0 ? "text-[var(--color-orange)]" : "text-[var(--text-faint)]"}`}
                  >
                    {trade.pnlSol >= 0 ? "+" : ""}
                    {fmt(trade.pnlSol)} SOL
                  </span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {date(trade.closedAt) ? (
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      {date(trade.closedAt)}
                    </span>
                  ) : null}
                  <Tx url={trade.txUrl} />
                </span>
              </div>
            ))}
          </Section>

          <Section title="Callouts" count={fund.callouts.length} empty="No fund callouts yet.">
            {fund.callouts.map((callout, index) => (
              <div
                key={`${callout.asset}-${index}`}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${index > 0 ? "border-t rule" : ""}`}
              >
                <span className="text-sm font-bold">{callout.asset}</span>
                {callout.platform ? (
                  <span className="font-mono text-xs text-[var(--text-faint)]">
                    {callout.platform}
                  </span>
                ) : null}
                {typeof callout.rewardSol === "number" ? (
                  <span className="font-mono text-xs">+{fmt(callout.rewardSol)} SOL</span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {date(callout.at) ? (
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      {date(callout.at)}
                    </span>
                  ) : null}
                  {callout.url ? (
                    <a
                      href={callout.url}
                      className="font-mono text-xs font-bold text-[var(--color-orange)] underline underline-offset-4"
                    >
                      callout →
                    </a>
                  ) : null}
                </span>
              </div>
            ))}
          </Section>

          <Section title="Buyback history" count={fund.buybacks.length} empty="No buybacks yet.">
            {fund.buybacks.map((buyback, index) => (
              <div
                key={`buyback-${index}`}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${index > 0 ? "border-t rule" : ""}`}
              >
                {typeof buyback.amountAttention === "number" ? (
                  <span className="font-mono text-sm font-bold">
                    {fmt(buyback.amountAttention)} ATTN
                  </span>
                ) : null}
                {typeof buyback.solSpent === "number" ? (
                  <span className="font-mono text-xs text-[var(--text-faint)]">
                    for {fmt(buyback.solSpent)} SOL
                  </span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {date(buyback.at) ? (
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      {date(buyback.at)}
                    </span>
                  ) : null}
                  <Tx url={buyback.txUrl} />
                </span>
              </div>
            ))}
          </Section>

          <Section title="Burn history" count={fund.burns.length} empty="No burns yet.">
            {fund.burns.map((burn, index) => (
              <div
                key={`burn-${index}`}
                className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 ${index > 0 ? "border-t rule" : ""}`}
              >
                {typeof burn.amountAttention === "number" ? (
                  <span className="font-mono text-sm font-bold text-[var(--color-orange)]">
                    {fmt(burn.amountAttention)} ATTN burned
                  </span>
                ) : null}
                <span className="ml-auto flex items-baseline gap-3">
                  {date(burn.at) ? (
                    <span className="font-mono text-xs text-[var(--text-faint)]">
                      {date(burn.at)}
                    </span>
                  ) : null}
                  <Tx url={burn.txUrl} />
                </span>
              </div>
            ))}
          </Section>
        </>
      )}
    </section>
  );
}
