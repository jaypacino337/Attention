import { AD_CONTACT, getPlacement, type AdSlotId } from "@/lib/ads";

/**
 * One ad placement. Sold slots render the advertiser; unsold slots render as
 * available inventory rather than blank space — an empty slot is a sales
 * pitch, not a layout hole.
 */
export function AdSlot({
  slot,
  label,
  size,
}: {
  slot: AdSlotId;
  label: string;
  size: string;
}) {
  const placement = getPlacement(slot);

  if (placement) {
    return (
      <a
        href={placement.href}
        rel="sponsored noopener"
        className="bracket block border rule bg-[var(--ground-raised)] p-6 hover:border-[var(--color-orange)]"
      >
        <div className="flex items-center justify-between">
          <span className="label">Sponsored</span>
          <span className="label">{placement.advertiser}</span>
        </div>
        <h3 className="mt-3 text-xl font-bold">{placement.headline}</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">{placement.body}</p>
      </a>
    );
  }

  return (
    <div className="flex min-h-40 flex-col justify-between border border-dashed rule bg-[var(--ground-raised)] p-6">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="label">{size}</span>
      </div>
      <div className="mt-4">
        <p className="text-lg font-bold">Available</p>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Put your project in front of an audience built on attention.
        </p>
        {AD_CONTACT ? (
          <a
            href={AD_CONTACT}
            className="mt-3 inline-block text-sm font-semibold text-[var(--color-orange)] underline underline-offset-4"
          >
            Enquire about this slot
          </a>
        ) : null}
      </div>
    </div>
  );
}
