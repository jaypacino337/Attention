import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { planRoute, type Level, type Node, type Rng, type Route } from "./route";

/** Hard size limit of a Solana transaction that every wallet can sign. */
export const TX_LIMIT = 1232;
export const BASE_FEE = 5000n;
const CU_PER_TRANSFER = 300;
const CU_PRICE_MICROLAMPORTS = 200_000;

export type BuiltSend = {
  route: Route;
  tx: VersionedTransaction;
  relays: Keypair[];
  bytes: number;
  feeLamports: bigint;
};

export function buildSendTx(opts: {
  sender: PublicKey;
  recipient: PublicKey;
  lamports: bigint;
  level: Level;
  rng: Rng;
  blockhash: string;
  /** a route already shown to the user; planned fresh when omitted */
  route?: Route;
}): BuiltSend {
  const route = opts.route ?? planRoute(opts.lamports, opts.level, opts.rng);
  const relays = Array.from({ length: route.relays }, () => Keypair.generate());
  const key = (n: Node) => (n.kind === "you" ? opts.sender : n.kind === "recipient" ? opts.recipient : relays[n.index].publicKey);

  const cuLimit = 3_000 + route.transfers.length * CU_PER_TRANSFER;
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: CU_PRICE_MICROLAMPORTS }),
    ...route.transfers.map((t) =>
      SystemProgram.transfer({ fromPubkey: key(t.from), toPubkey: key(t.to), lamports: t.lamports }),
    ),
  ];
  const message = new TransactionMessage({
    payerKey: opts.sender,
    recentBlockhash: opts.blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  // only relays that actually send must sign; an unused relay is dropped by the compiler
  const signers = relays.filter((r) => message.staticAccountKeys.some((k, i) => i < message.header.numRequiredSignatures && k.equals(r.publicKey)));
  const bytes = tx.serialize().length;
  const signatures = BigInt(message.header.numRequiredSignatures);
  const feeLamports = signatures * BASE_FEE + BigInt(Math.ceil((cuLimit * CU_PRICE_MICROLAMPORTS) / 1e6));
  return { route, tx, relays: signers, bytes, feeLamports };
}

/** Byte breakdown of a serialized v0 transaction, for the size chart. */
export function byteBreakdown(tx: VersionedTransaction) {
  const m = tx.message;
  const sigs = 1 + m.header.numRequiredSignatures * 64;
  const addresses = 1 + m.staticAccountKeys.length * 32;
  const total = tx.serialize().length;
  const blockhash = 32;
  const instructions = total - sigs - addresses - blockhash - 1 - 3 - 1; // version, header, lookup count
  return { signatures: sigs, addresses, blockhash, instructions, total };
}
