// Deploys MartCoin + BlockMart and lists every catalogue item on-chain.
// Usage: RPC_URL=... OWNER_PRIVATE_KEY=0x... node scripts/deploy.mjs
//   (optional) RPC_KEY=... is sent as the X-Chain-Key header.
// Run `forge build` in ./contracts first.
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8546";
const pk = process.env.OWNER_PRIVATE_KEY;
if (!pk) throw new Error("Set OWNER_PRIVATE_KEY");

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const coinArt = read("../contracts/out/MartCoin.sol/MartCoin.json");
const shopArt = read("../contracts/out/BlockMart.sol/BlockMart.json");
const catalog = read("../src/lib/catalog.json");

const transport = http(rpcUrl, {
  fetchOptions: process.env.RPC_KEY ? { headers: { "X-Chain-Key": process.env.RPC_KEY } } : undefined,
});
const pub = createPublicClient({ transport });
const chainId = await pub.getChainId();
const chain = {
  id: chainId,
  name: "BlockMart Testnet",
  nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
};
const account = privateKeyToAccount(pk);
const wallet = createWalletClient({ account, chain, transport });

async function deploy(art, args = []) {
  const hash = await wallet.deployContract({ abi: art.abi, bytecode: art.bytecode.object, args });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("deploy failed");
  return { address: receipt.contractAddress, block: Number(receipt.blockNumber) };
}

const coin = await deploy(coinArt);
const shop = await deploy(shopArt, [coin.address]);
console.log("MartCoin ", coin.address);
console.log("BlockMart", shop.address);

let hash = await wallet.writeContract({ address: coin.address, abi: coinArt.abi, functionName: "setShop", args: [shop.address] });
await pub.waitForTransactionReceipt({ hash });

for (const item of catalog) {
  hash = await wallet.writeContract({
    address: shop.address,
    abi: shopArt.abi,
    functionName: "addItem",
    args: [item.name, parseEther(String(item.price)), item.stock],
  });
  await pub.waitForTransactionReceipt({ hash });
}
const count = await pub.readContract({ address: shop.address, abi: shopArt.abi, functionName: "itemCount" });
console.log("items listed:", Number(count));

writeFileSync(
  new URL("../src/lib/deployment.json", import.meta.url),
  JSON.stringify({ chainId, coin: coin.address, shop: shop.address, deployedAtBlock: coin.block }, null, 2) + "\n",
);
writeFileSync(
  new URL("../src/lib/abi.json", import.meta.url),
  JSON.stringify({ coin: coinArt.abi, shop: shopArt.abi }) + "\n",
);
console.log("wrote src/lib/deployment.json and src/lib/abi.json");
