import fs from "node:fs/promises";
import path from "node:path";

/**
 * Persistence for wallet ↔ X links.
 *
 * This is a JSON file behind a narrow interface. It is correct for local dev
 * and a single long-lived server, and it is NOT durable on serverless hosts
 * (Vercel included) where the filesystem is ephemeral and per-instance.
 * Before running social rewards for real, swap `read`/`write` for Postgres,
 * Vercel KV, or Redis — nothing outside this file needs to change.
 */

export type XLink = {
  wallet: string;
  handle: string;
  /** Epoch ms when the link was created. */
  linkedAt: number;
  /**
   * Whether the handle has been proven to belong to the wallet holder.
   * Set by the X OAuth callback; a self-declared handle stays false and must
   * not be paid out on.
   */
  verified: boolean;
};

type Db = { links: Record<string, XLink> };

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "links.json");
const EMPTY: Db = { links: {} };

async function read(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Db;
    return { links: parsed.links ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

async function write(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

export async function getLink(wallet: string): Promise<XLink | null> {
  const db = await read();
  return db.links[wallet] ?? null;
}

/**
 * Bind an X handle to a wallet.
 *
 * One handle may map to only one wallet: without that rule the same account's
 * reach could be claimed from several wallets and paid multiple times.
 */
export async function setLink(
  wallet: string,
  handle: string,
  verified = false,
): Promise<{ ok: true; link: XLink } | { ok: false; error: string }> {
  const normalized = handle.replace(/^@/, "").trim().toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(normalized)) {
    return { ok: false, error: "That is not a valid X handle." };
  }

  const db = await read();
  const conflict = Object.values(db.links).find(
    (link) => link.handle === normalized && link.wallet !== wallet,
  );
  if (conflict) {
    return { ok: false, error: "That X account is already linked to another wallet." };
  }

  const link: XLink = { wallet, handle: normalized, linkedAt: Date.now(), verified };
  db.links[wallet] = link;
  await write(db);
  return { ok: true, link };
}

export async function removeLink(wallet: string): Promise<void> {
  const db = await read();
  delete db.links[wallet];
  await write(db);
}
