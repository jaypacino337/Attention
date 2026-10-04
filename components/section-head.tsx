import { Reveal } from "./fx/Reveal";

/** Magazine section header: issue number, kicker rule, oversized title. */
export function SectionHead({ no, kicker, title, children }: { no: string; kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal>
      <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
        <span className="bg-ink px-2 py-0.5 font-mono text-[11px] font-extrabold text-paper">{no}</span>
        <span className="label !text-ink">{kicker}</span>
      </div>
      <h2 className="display mt-6 text-balance text-[clamp(2.6rem,8vw,6.5rem)]">{title}</h2>
      {children ? <div className="mt-5 max-w-2xl text-pretty text-lg text-ink-soft">{children}</div> : null}
    </Reveal>
  );
}
