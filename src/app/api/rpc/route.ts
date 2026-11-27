import { NextResponse } from "next/server";

// A filtered door to the chain. Browsers and MetaMask talk to this, never to
// the node itself, and only the read/broadcast methods below get through.
// Anything that could sign with the node's own accounts or rewrite chain
// state (eth_sendTransaction, eth_sign, anvil_*, evm_*, debug_*) is refused.
const ALLOWED = new Set([
  "eth_chainId",
  "net_version",
  "web3_clientVersion",
  "eth_syncing",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_sendRawTransaction",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getLogs",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

type Call = { jsonrpc?: string; id?: unknown; method?: unknown; params?: unknown };

const err = (id: unknown, code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  const text = await req.text();
  if (text.length > 200_000) return NextResponse.json(err(null, -32600, "Request too large"), { status: 413, headers: CORS });

  let body: Call | Call[];
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error"), { status: 400, headers: CORS });
  }

  const calls = Array.isArray(body) ? body : [body];
  if (calls.length === 0 || calls.length > 25) {
    return NextResponse.json(err(null, -32600, "Invalid batch size"), { status: 400, headers: CORS });
  }
  for (const c of calls) {
    if (!c || typeof c !== "object" || typeof c.method !== "string" || !ALLOWED.has(c.method)) {
      const out = err(c?.id, -32601, "Method not allowed on this network");
      return NextResponse.json(Array.isArray(body) ? [out] : out, { status: 200, headers: CORS });
    }
  }

  const url = process.env.CHAIN_RPC_URL || "http://127.0.0.1:8546";
  const key = process.env.CHAIN_RPC_KEY;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { "X-Chain-Key": key } : {}) },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const out = await res.text();
    return new NextResponse(out, { status: res.ok ? 200 : 502, headers: { "content-type": "application/json", ...CORS } });
  } catch {
    return NextResponse.json(err(null, -32000, "The BlockMart chain is not reachable right now"), { status: 502, headers: CORS });
  }
}
