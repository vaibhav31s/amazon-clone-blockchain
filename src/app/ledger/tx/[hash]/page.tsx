import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEther, formatGwei, parseEventLogs, type Hex } from "viem";
import { Check, X } from "@/components/icons";
import { catalog, fmtMart } from "@/lib/catalog";
import { coinAbi, nameOf, shopAbi, short } from "@/lib/chain";
import { describeTx } from "@/lib/ledger";
import { serverClient } from "@/lib/server-chain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Transaction" };

type Ev = { eventName: string; args: Record<string, unknown> };

function sentence(e: Ev): string | null {
  const a = e.args;
  const mart = (v: unknown) => `${fmtMart(Number(formatEther(v as bigint)))} MART`;
  switch (e.eventName) {
    case "CoinsBought":
      return `${short(a.buyer as string)} paid ${formatEther(a.ethPaid as bigint)} test ETH and received ${mart(a.coins)}.`;
    case "ItemPurchased": {
      const name = catalog[Number(a.itemId)]?.name ?? `item #${a.itemId}`;
      return `${a.qty} × ${name} at ${mart(a.price)} each.`;
    }
    case "OrderPlaced":
      return `Order #${a.orderId} was filed for ${short(a.buyer as string)}, total ${mart(a.total)}.`;
    case "ItemAdded":
      return `"${a.name}" was listed at ${mart(a.price)} with ${a.stock} in stock.`;
    case "ShopSet":
      return `The coin contract now trusts the shop at ${short(a.shop as string)}.`;
    case "Transfer": {
      const from = a.from as string;
      if (/^0x0+$/.test(from)) return `${mart(a.value)} were created for ${short(a.to as string)}.`;
      return `${mart(a.value)} moved from ${short(from)} to ${nameOf(a.to as string) ?? short(a.to as string)}.`;
    }
    default:
      return null;
  }
}

function Addr({ a }: { a: string | null }) {
  if (!a) return <span className="text-muted">New contract</span>;
  const n = nameOf(a);
  return (
    <span className="flex flex-col items-end">
      {n && <span className="font-semibold">{n}</span>}
      <span className="hash break-all text-right text-muted">{a}</span>
    </span>
  );
}

export default async function TxPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) notFound();

  let tx, receipt, block;
  try {
    [tx, receipt] = await Promise.all([serverClient.getTransaction({ hash: hash as Hex }), serverClient.getTransactionReceipt({ hash: hash as Hex })]);
    block = await serverClient.getBlock({ blockNumber: receipt.blockNumber });
  } catch {
    notFound();
  }

  const info = describeTx({ to: tx.to, input: tx.input, value: tx.value });
  const ok = receipt.status === "success";
  let events: Ev[] = [];
  try {
    events = parseEventLogs({ abi: [...coinAbi, ...shopAbi], logs: receipt.logs }) as unknown as Ev[];
  } catch {}
  const story = events.map(sentence).filter(Boolean) as string[];
  const fee = receipt.gasUsed * receipt.effectiveGasPrice;

  const rows: [string, React.ReactNode][] = [
    ["Status", <span key="s" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${ok ? "bg-mint text-green-deep" : "bg-coral/15 text-[#a03a1c]"}`}>{ok ? <Check width={14} height={14} /> : <X width={14} height={14} />}{ok ? "Confirmed" : "Failed"}</span>],
    ["Block", <span key="b" className="hash">#{Number(receipt.blockNumber)}</span>],
    ["When", new Date(Number(block.timestamp) * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" }) + " IST"],
    ["From", <Addr key="f" a={tx.from} />],
    ["To", <Addr key="t" a={tx.to ?? null} />],
    ["Test ETH sent", `${formatEther(tx.value)} ETH`],
    ["Network fee", `${Number(formatEther(fee)).toFixed(6)} ETH (${receipt.gasUsed.toLocaleString("en-IN")} gas at ${Number(formatGwei(receipt.effectiveGasPrice)).toFixed(2)} gwei)`],
  ];

  return (
    <div className="wrap max-w-3xl pt-8 sm:pt-12">
      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/ledger" className="hover:text-ink">Ledger</Link> <span aria-hidden>/</span> Transaction
      </nav>
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{info.label}</h1>
      {info.detail && <p className="mt-2 text-lg text-muted">{info.detail}</p>}
      <p className="hash mt-4 break-all rounded-xl border border-line bg-surface px-4 py-3">{hash}</p>

      {story.length > 0 && (
        <section className="card mt-6 p-5" aria-label="What happened">
          <h2 className="font-display text-lg font-bold tracking-tight">What happened</h2>
          <ol className="mt-3 grid gap-2.5">
            {story.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint text-[11px] font-bold text-green-deep">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>
      )}

      <dl className="card mt-4 divide-y divide-line px-5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-6 py-3.5 text-sm">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className="min-w-0 text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {tx.input !== "0x" && (
        <details className="card mt-4 px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold">Raw data sent to the contract</summary>
          <p className="hash mt-3 max-h-48 overflow-auto break-all text-muted">{tx.input}</p>
        </details>
      )}
    </div>
  );
}
