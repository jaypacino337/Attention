import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS } from "@/lib/route";
import { MIN_ELIGIBLE, TOKEN } from "@/lib/config";

export const metadata: Metadata = { title: "Docs · PRVC", description: "How PRVC Send and Swap work, what they cost and what they protect." };

const H = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="mt-14 scroll-mt-24 text-2xl font-extrabold tracking-tight first:mt-0">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 leading-relaxed text-[var(--text-soft)]">{children}</p>;

const TOC = [
  ["send", "Send"],
  ["levels", "Privacy levels"],
  ["swap", "Swap"],
  ["safety", "Safety"],
  ["limits", "What it does not do"],
  ["costs", "Costs"],
  ["token", `${TOKEN.symbol} token`],
];

export default function DocsPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[200px_1fr] md:py-20">
      <nav aria-label="On this page" className="md:sticky md:top-24 md:self-start">
        <p className="label">Docs</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm md:block md:space-y-2">
          {TOC.map(([id, t]) => <li key={id}><a href={`#${id}`} className="text-[var(--text-soft)] hover:text-[var(--color-orange)]">{t}</a></li>)}
        </ul>
      </nav>
      <article className="max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">How PRVC <span className="serif-italic font-normal text-[var(--color-orange)]">works</span>.</h1>
        <P>PRVC is two non-custodial tools on Solana mainnet. Both run in your browser, both settle in one transaction you sign, and neither ever holds your money.</P>

        <H id="send">Send</H>
        <P>You enter a recipient and an amount of SOL. Your browser then:</P>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--text-soft)]">
          <li>Splits the amount into uneven real parts.</li>
          <li>Generates fresh, throwaway relay wallets.</li>
          <li>Sends each part from you through one or two relays to the recipient.</li>
          <li>Adds decoys: transfers sized like the real parts that travel through relays and come back to you.</li>
          <li>Shuffles every transfer into a random order (a relay never sends before it has received).</li>
        </ol>
        <P>The whole route is one transaction. It is simulated first; then your wallet signs it, the relays co-sign, and their keys are discarded. Every relay ends at exactly zero. You see the exact route before you sign, and can reshuffle it.</P>

        <H id="levels">Privacy levels</H>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border rule text-left text-sm">
            <thead className="font-mono text-[11px] uppercase tracking-widest text-[var(--text-faint)]"><tr className="border-b rule"><th className="p-3">Level</th><th className="p-3">Relays</th><th className="p-3">Real parts</th><th className="p-3">Decoys</th></tr></thead>
            <tbody>
              {Object.values(LEVELS).map((l) => (
                <tr key={l.label} className="border-b rule last:border-b-0"><td className="p-3 font-bold">{l.label}</td><td className="p-3 font-mono">{l.relays}</td><td className="p-3 font-mono">{l.parts}</td><td className="p-3 font-mono">{l.decoys}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>Every level fits within Solana&apos;s 1,232-byte transaction limit, so any wallet can sign it.</P>

        <H id="swap">Swap</H>
        <P>Pay in SOL, USDC or USDT and choose the token the recipient should get. PRVC asks Jupiter for the best route and points the swap&apos;s output at the recipient&apos;s token account (creating it if needed, paid by you). On-chain this reads as a swap you made, with no transfer from you to them.</P>

        <H id="safety">Safety</H>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--text-soft)]">
          <li><b className="text-[var(--text)]">Non-custodial.</b> There is no PRVC contract, pool or wallet in the path. Funds go from you, through relays only you control for that one transaction, to the recipient.</li>
          <li><b className="text-[var(--text)]">All or nothing.</b> Solana transactions are atomic. If any transfer fails, none of them happen.</li>
          <li><b className="text-[var(--text)]">Simulated first.</b> Every send and swap is simulated on mainnet before your wallet is asked to sign.</li>
          <li><b className="text-[var(--text)]">Check the address.</b> Transfers cannot be reversed. Paste the recipient carefully.</li>
        </ul>

        <H id="limits">What it does not do</H>
        <P>Send breaks the straight line that explorers, wallet trackers and casual watchers follow. It does not make a payment invisible: someone who decodes every instruction in the transaction can still reconstruct it, and the amounts and wallets are public on-chain. Use PRVC for everyday financial privacy, and use it lawfully.</P>

        <H id="costs">Costs</H>
        <P>PRVC charges no fee. You pay Solana&apos;s network fee (5,000 lamports per signature plus a small priority fee, usually well under a cent) and, on swaps, the pool fees inside Jupiter&apos;s quote.</P>

        <H id="token">{TOKEN.symbol} token</H>
        <P>Creator fees from {TOKEN.symbol} trading are shared back to holders. Wallets holding at least {MIN_ELIGIBLE.toLocaleString("en-US")} {TOKEN.symbol} are found by an on-chain scan and paid by airdrop. There is never anything to claim or sign for rewards.</P>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/send" className="btn-primary">Send privately →</Link>
          <Link href="/swap" className="btn-ghost">Open swap</Link>
        </div>
      </article>
    </div>
  );
}
