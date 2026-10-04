/**
 * File backend: one JSON file per mint in ATTENTION_DATA_DIR (default ./.data).
 * PORTED from memcoinz .claude/skills/launchpad-site/preset-seats/lib/store.file.ts.
 * For dev, or one server with a persistent disk. Never used on Vercel (see store.ts).
 */
import fs from "node:fs/promises";
import path from "node:path";
import type { SeatCoin } from "./seats-core";
import type { CallerStore } from "./store";

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 1));
  await fs.rename(tmp, file); // atomic: readers never see a half-written file
}

const safe = (mint: string) => {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error("bad mint");
  return mint;
};

export function fileStore(dir = process.env.ATTENTION_DATA_DIR ?? path.join(process.cwd(), ".data")): CallerStore {
  const locks = new Map<string, Promise<unknown>>();
  /** Serialises read-modify-write per key so two claims can't race. */
  function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(key, next.catch(() => undefined));
    return next;
  }
  const coinFile = (mint: string) => path.join(dir, "callers", `${safe(mint)}.json`);

  return {
    backend: "file",
    getCoin: (mint) => readJson<SeatCoin>(coinFile(mint)),
    updateCoin: (mint, fn) =>
      withLock(mint, async () => {
        const coin = await readJson<SeatCoin>(coinFile(mint));
        if (!coin) throw new Error("Unknown coin");
        const out = await fn(coin);
        await writeJson(coinFile(mint), coin);
        return out;
      }),
    createCoin: (coin) =>
      withLock(coin.mint, async () => {
        if (await readJson(coinFile(coin.mint))) return;
        await writeJson(coinFile(coin.mint), coin);
      }),
  };
}
