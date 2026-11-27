import type { Metadata } from "next";
import Link from "next/link";
import { fmtMart } from "@/lib/catalog";
import { short } from "@/lib/chain";
import { ago, getLedger, type TxRow } from "@/lib/ledger";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ledger", description: "Every transaction on the BlockMart chain, newest first." };

const tone: Record<TxRow["kind"], string> = {
  order: "bg-green text-white",
  coins: "bg-sun text-ink",
  faucet: "bg-mint text-green-deep",
  listing: "bg-line text-ink",
  deploy: "bg-ink text-paper",
  setup: "bg-line text-ink",
  transfer: "bg-line text-ink",
};

export default async function LedgerPage() {
  const ledger = await getLedger(40).catch(() => null);

  return (
    <div className="wrap max-w-5xl pt-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">The ledger</h1>
      <p className="mt-3 max-w-2xl text-muted">Everything that has happened in this shop, newest first. Every coin bought and every order placed is a transaction anyone can open and check.</p>

      {!ledger ? (
        <p className="card mt-8 px-6 py-12 text-center text-muted">The BlockMart chain is not answering right now. Please try again in a minute.</p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-3 gap-3">
            {[
              ["Latest block", `#${ledger.head.toLocaleString("en-IN")}`],
              ["Orders placed", ledger.orders.toLocaleString("en-IN")],
              ["MART coins issued", fmtMart(Math.round(ledger.supply))],
            ].map(([k, v]) => (
              <div key={k} className="card p-4 sm:p-5">
                <dt className="text-xs text-muted sm:text-sm">{k}</dt>
                <dd className="mt-1 font-display text-xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="card mt-4 overflow-hidden">
            <ul className="divide-y divide-line">
              {ledger.rows.map((r) => (
                <li key={r.hash}>
                  <Link href={`/ledger/tx/${r.hash}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-paper sm:px-5">
                    <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${tone[r.kind]}`}>{r.label}</span>
                    <span className="min-w-0 truncate text-sm">
                      {r.detail} <span className="text-muted">· from {short(r.from)}</span>
                    </span>
                    <span className="text-right">
                      <span className="hash block text-green-deep">{short(r.hash, 4)}</span>
                      <span className="block text-xs text-muted">block #{r.block} · {ago(r.time)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-sm text-muted">Showing the latest {ledger.rows.length} transactions.</p>
        </>
      )}
    </div>
  );
}
