/**
 * Ad inventory.
 *
 * Sold placements are configured here (or via ADS_JSON) rather than pulled
 * from an ad network: the site sells its own slots, so inventory is a small
 * owned list, and no third-party ad script gets to run on a page where people
 * connect wallets.
 */

export type AdSlotId = "banner" | "terminal";

export type Placement = {
  slot: AdSlotId;
  advertiser: string;
  headline: string;
  body: string;
  href: string;
  /** Epoch ms; a placement past its end date stops rendering. */
  endsAt: number;
};

function load(): Placement[] {
  const raw = process.env.ADS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Placement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A malformed env var must not take the page down — fall back to empty.
    return [];
  }
}

export function getPlacement(slot: AdSlotId): Placement | null {
  const now = Date.now();
  return load().find((p) => p.slot === slot && p.endsAt > now) ?? null;
}

export const AD_CONTACT = process.env.NEXT_PUBLIC_AD_CONTACT ?? "";
