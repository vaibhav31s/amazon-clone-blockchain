import "server-only";
import { createPublicClient, formatEther, http } from "viem";
import { blockmartChain, SHOP, shopAbi } from "./chain";
import { baseProduct, catalog, type Product } from "./catalog";

const url = process.env.CHAIN_RPC_URL || "http://127.0.0.1:8546";
const key = process.env.CHAIN_RPC_KEY;

export const serverClient = createPublicClient({
  chain: blockmartChain(url),
  transport: http(url, {
    batch: true,
    timeout: 8000,
    retryCount: 1,
    fetchOptions: { cache: "no-store", headers: key ? { "X-Chain-Key": key } : undefined },
  }),
});

type RawItem = { id: bigint; name: string; price: bigint; stock: number; sold: number; active: boolean };

/** Products with live price and stock from the contract. Falls back to the
 *  static catalogue if the chain cannot be reached, so the shop still renders. */
export async function getProducts(): Promise<{ products: Product[]; live: boolean }> {
  try {
    const items = (await serverClient.readContract({
      address: SHOP,
      abi: shopAbi,
      functionName: "getItems",
    })) as RawItem[];
    const products = catalog.map((_, id) => {
      const p = baseProduct(id);
      const it = items[id];
      if (!it) return { ...p, active: false };
      return { ...p, price: Number(formatEther(it.price)), stock: Number(it.stock), sold: Number(it.sold), active: it.active };
    });
    return { products, live: true };
  } catch {
    return { products: catalog.map((_, id) => baseProduct(id)), live: false };
  }
}
