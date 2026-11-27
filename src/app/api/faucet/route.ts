import { NextResponse } from "next/server";
import { createWalletClient, http, isAddress, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { blockmartChain } from "@/lib/chain";
import { serverClient } from "@/lib/server-chain";

// Hands out test ETH (worth nothing) so anyone can try the shop.
const DRIP = parseEther("1");
const ENOUGH = parseEther("0.25");

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 60_000) {
    hits.set(ip, { n: 1, t: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n += 1;
  return h.n > 6;
}

export async function POST(req: Request) {
  const pk = process.env.FAUCET_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) return NextResponse.json({ error: "The faucet is not set up." }, { status: 503 });

  const ip = (req.headers.get("x-forwarded-for") || "?").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });

  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  if (!address || !isAddress(address)) return NextResponse.json({ error: "That is not a wallet address." }, { status: 400 });

  try {
    const balance = await serverClient.getBalance({ address });
    if (balance >= ENOUGH) return NextResponse.json({ ok: true, skipped: true });

    const url = process.env.CHAIN_RPC_URL || "http://127.0.0.1:8546";
    const key = process.env.CHAIN_RPC_KEY;
    const account = privateKeyToAccount(pk);
    const wallet = createWalletClient({
      account,
      chain: blockmartChain(url),
      transport: http(url, { fetchOptions: { cache: "no-store", headers: key ? { "X-Chain-Key": key } : undefined } }),
    });

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const hash = await wallet.sendTransaction({ to: address, value: DRIP });
        await serverClient.waitForTransactionReceipt({ hash, timeout: 15_000 });
        return NextResponse.json({ ok: true, hash });
      } catch (e) {
        lastError = e; // most likely two drips raced for the same nonce: try again
        await new Promise((r) => setTimeout(r, 300 + attempt * 400));
      }
    }
    throw lastError;
  } catch {
    return NextResponse.json({ error: "The faucet could not send test ETH just now. Please try again." }, { status: 502 });
  }
}
