import { defineChain, type Abi } from "viem";
import deployment from "./deployment.json";
import abis from "./abi.json";

export const CHAIN_ID = deployment.chainId;
export const COIN = deployment.coin as `0x${string}`;
export const SHOP = deployment.shop as `0x${string}`;
export const DEPLOY_BLOCK = BigInt(deployment.deployedAtBlock);

export const coinAbi = abis.coin as Abi;
export const shopAbi = abis.shop as Abi;

/** ETH price of one MART coin (fixed in the coin contract). */
export const ETH_PER_MART = 0.0001;

export const CHAIN_NAME = "BlockMart Testnet";

/** `rpcUrl` differs between browser (our filtered proxy) and server (the node itself). */
export function blockmartChain(rpcUrl: string) {
  return defineChain({
    id: CHAIN_ID,
    name: CHAIN_NAME,
    nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}

export function short(addr?: string | null, n = 4) {
  if (!addr) return "";
  return `${addr.slice(0, 2 + n)}…${addr.slice(-n)}`;
}

export function nameOf(addr?: string | null): string | null {
  if (!addr) return null;
  const a = addr.toLowerCase();
  if (a === COIN.toLowerCase()) return "Mart Coin contract";
  if (a === SHOP.toLowerCase()) return "BlockMart shop contract";
  return null;
}
