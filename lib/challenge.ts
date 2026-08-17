import crypto from "node:crypto";

/**
 * Stateless sign-in challenges.
 *
 * A challenge is `<expiry>.<hmac(wallet|expiry)>` rather than a random string
 * kept in a table. On serverless every request may hit a different instance,
 * so an in-memory nonce map would reject perfectly valid logins at random;
 * binding the nonce to the wallet and an expiry with an HMAC lets any
 * instance verify it with no shared storage.
 */

const TTL_MS = 2 * 60 * 1000; // 2 minutes to sign

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (32+ random chars) in production");
  }
  return "dev-only-insecure-session-secret";
}

function mac(wallet: string, expiry: number): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${wallet}|${expiry}`)
    .digest("base64url");
}

export function issueChallenge(wallet: string): string {
  const expiry = Date.now() + TTL_MS;
  return `${expiry}.${mac(wallet, expiry)}`;
}

export function verifyChallenge(wallet: string, challenge: string): boolean {
  const [expiryRaw, provided] = challenge.split(".");
  const expiry = Number(expiryRaw);
  if (!expiryRaw || !provided || !Number.isFinite(expiry)) return false;
  if (Date.now() > expiry) return false;

  const expected = mac(wallet, expiry);
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * The exact text the wallet signs. Shown to the user in their wallet, so it
 * states plainly what they are approving — and says it costs nothing, because
 * a signature prompt that looks like a transaction is how people get drained.
 */
export function challengeMessage(wallet: string, challenge: string): string {
  return [
    "Attention Markets — verify wallet",
    "",
    "Signing proves you control this wallet.",
    "This is a signature only: no transaction, no fee, no token approval.",
    "",
    `Wallet: ${wallet}`,
    `Challenge: ${challenge}`,
  ].join("\n");
}
