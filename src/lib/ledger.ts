import "server-only";
import { decodeFunctionData, formatEther, type Hex } from "viem";
import { COIN, coinAbi, SHOP, shopAbi } from "./chain";
import { catalog, fmtMart } from "./catalog";
import { serverClient } from "./server-chain";

export type TxRow = {
  hash: Hex;
  block: number;
  time: number;
  from: string;
  to: string | null;
  kind: "order" | "coins" | "faucet" | "listing" | "deploy" | "setup" | "transfer";
  label: string;
  detail: string;
};

const lower = (s?: string | null) => (s || "").toLowerCase();

export function describeTx(t: { to: string | null; input: Hex; value: bigint }): Pick<TxRow, "kind" | "label" | "detail"> {
  if (!t.to) return { kind: "deploy", label: "Contract deployed", detail: "A smart contract was put on the chain" };
  const to = lower(t.to);
  try {
    if (to === lower(SHOP)) {
      const d = decodeFunctionData({ abi: shopAbi, data: t.input });
      if (d.functionName === "checkout") {
        const [ids, qtys] = d.args as [number[], number[]];
        const count = qtys.reduce((n, q) => n + Number(q), 0);
        const first = catalog[Number(ids[0])]?.name ?? "an item";
        return { kind: "order", label: "Order placed", detail: ids.length > 1 ? `${count} items, including ${first}` : `${count} × ${first}` };
      }
      if (d.functionName === "addItem") {
        const [name, price] = d.args as [string, bigint];
        return { kind: "listing", label: "Item listed", detail: `${name} at ${fmtMart(Number(formatEther(price)))} MART` };
      }
      return { kind: "setup", label: "Shop updated", detail: d.functionName };
    }
    if (to === lower(COIN)) {
      if (t.input === "0x" || decodeFunctionData({ abi: coinAbi, data: t.input }).functionName === "buy") {
        const eth = Number(formatEther(t.value));
        return { kind: "coins", label: "Coins bought", detail: `${fmtMart(eth * 10000)} MART for ${eth} test ETH` };
      }
      const d = decodeFunctionData({ abi: coinAbi, data: t.input });
      if (d.functionName === "setShop") return { kind: "setup", label: "Shop linked to coin", detail: "One-time setup" };
      if (d.functionName === "transfer") {
        const [, amount] = d.args as [string, bigint];
        return { kind: "transfer", label: "Coins sent", detail: `${fmtMart(Number(formatEther(amount)))} MART` };
      }
      return { kind: "setup", label: "Coin contract call", detail: d.functionName };
    }
  } catch {}
  if (t.value > 0n) return { kind: "faucet", label: "Test ETH sent", detail: `${Number(formatEther(t.value))} test ETH` };
  return { kind: "transfer", label: "Transaction", detail: "" };
}

export async function getLedger(limit = 30) {
  const head = await serverClient.getBlockNumber();
  const from = head - BigInt(limit) + 1n > 0n ? head - BigInt(limit) + 1n : 0n;
  const numbers: bigint[] = [];
  for (let n = head; n >= from; n--) numbers.push(n);

  const [blocks, orderCount, supply] = await Promise.all([
    Promise.all(numbers.map((n) => serverClient.getBlock({ blockNumber: n, includeTransactions: true }))),
    serverClient.readContract({ address: SHOP, abi: shopAbi, functionName: "orderCount" }) as Promise<bigint>,
    serverClient.readContract({ address: COIN, abi: coinAbi, functionName: "totalSupply" }) as Promise<bigint>,
  ]);

  const rows: TxRow[] = [];
  for (const b of blocks) {
    for (const t of b.transactions) {
      rows.push({
        hash: t.hash,
        block: Number(b.number),
        time: Number(b.timestamp),
        from: t.from,
        to: t.to,
        ...describeTx({ to: t.to, input: t.input, value: t.value }),
      });
    }
  }
  return { head: Number(head), orders: Number(orderCount), supply: Number(formatEther(supply)), rows };
}

export async function getStats() {
  try {
    const [head, orderCount, supply] = await Promise.all([
      serverClient.getBlockNumber(),
      serverClient.readContract({ address: SHOP, abi: shopAbi, functionName: "orderCount" }) as Promise<bigint>,
      serverClient.readContract({ address: COIN, abi: coinAbi, functionName: "totalSupply" }) as Promise<bigint>,
    ]);
    return { head: Number(head), orders: Number(orderCount), supply: Number(formatEther(supply)) };
  } catch {
    return null;
  }
}

export function ago(unix: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - unix);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
