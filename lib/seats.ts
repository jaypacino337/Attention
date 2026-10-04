/**
 * Seat vocabulary used by lib/seats-core.ts.
 * PORTED from memcoinz .claude/skills/launchpad-site/preset-seats/lib/seats.ts
 * (seatLabel + batchMessage verbatim). The `pad` launchpad config is replaced by
 * Attention's own: the handle people @mention lives in lib/config.ts (X_POOL).
 */

/** Airline-style seat label for the nth seat (0-based): 1A..1F, 2A.. */
export const seatLabel = (n: number) => `${Math.floor(n / 6) + 1}${"ABCDEF"[n % 6]}`;

/** What the creator signs to open a batch (built identically on client and server). */
export const batchMessage = (mint: string, count: number, openAt: number) => `Open ${count} seats on ${mint} at ${new Date(openAt).toISOString()}`;
