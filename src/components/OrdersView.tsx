"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { catalog, fmtMart } from "@/lib/catalog";
import { DEPLOY_BLOCK, SHOP, shopAbi, short } from "@/lib/chain";
import { Arrow, Cube } from "./icons";
import { Price } from "./Price";
import { useChainReader, useStore } from "./store";

type Order = { id: number; time: number; total: number; lines: { itemId: number; qty: number; price: number }[]; hash?: string };
type RawOrder = { id: bigint; buyer: string; time: bigint; total: bigint; lines: { itemId: number; qty: number; price: bigint }[] };

export function OrdersView() {
  const s = useStore();
  const reader = useChainReader();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!s.address) {
      setOrders(null);
      return;
    }
    let off = false;
    setFailed(false);
    (async () => {
      try {
        const raw = (await reader.readContract({ address: SHOP, abi: shopAbi, functionName: "getOrdersOf", args: [s.address, 50n] })) as RawOrder[];
        const list: Order[] = raw.map((o) => ({
          id: Number(o.id),
          time: Number(o.time),
          total: Number(formatEther(o.total)),
          lines: o.lines.map((l) => ({ itemId: Number(l.itemId), qty: Number(l.qty), price: Number(formatEther(l.price)) })),
        }));
        if (off) return;
        setOrders(list);
        // match each order to the transaction that created it
        const ev = shopAbi.find((x) => x.type === "event" && x.name === "OrderPlaced");
        if (ev && list.length) {
          const logs = await reader.getLogs({ address: SHOP, event: ev as never, args: { buyer: s.address } as never, fromBlock: DEPLOY_BLOCK, toBlock: "latest" });
          const byId = new Map<number, string>();
          for (const l of logs as unknown as { args: { orderId: bigint }; transactionHash: string }[]) byId.set(Number(l.args.orderId), l.transactionHash);
          if (!off) setOrders(list.map((o) => ({ ...o, hash: byId.get(o.id) })));
        }
      } catch {
        if (!off) setFailed(true);
      }
    })();
    return () => {
      off = true;
    };
  }, [s.address, reader]);

  return (
    <div className="wrap max-w-4xl pt-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Your orders</h1>
      <p className="mt-3 max-w-xl text-muted">This list is not stored by us. It is read from the shop contract using your wallet address, so it follows your wallet anywhere.</p>

      <div className="mt-8">
        {!s.ready ? null : !s.address ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-display text-xl font-bold">Connect a wallet to see its orders.</p>
            <button className="btn btn-primary mt-5" onClick={() => s.setConnectOpen(true)}>Connect wallet</button>
          </div>
        ) : failed ? (
          <p className="card px-6 py-12 text-center text-muted">Could not reach the chain. Refresh to try again.</p>
        ) : orders === null ? (
          <div className="grid gap-3" aria-busy="true" aria-label="Loading orders">
            {[0, 1].map((i) => <div key={i} className="card h-36 animate-pulse bg-line/40" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-display text-xl font-bold">No orders from this wallet yet.</p>
            <Link href="/#shop" className="btn btn-primary mt-5">Browse the shop <Arrow width={18} height={18} /></Link>
          </div>
        ) : (
          <ul className="grid gap-4">
            {orders.map((o, i) => (
              <li key={o.id} className="card rise overflow-hidden" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line bg-paper/60 px-5 py-3 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-lg font-extrabold">Order #{o.id}</span>
                    <span className="text-muted">{new Date(o.time * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>
                  {o.hash && (
                    <Link href={`/ledger/tx/${o.hash}`} className="hash inline-flex items-center gap-1.5 text-green-deep underline-offset-4 hover:underline">
                      <Cube width={13} height={13} /> {short(o.hash, 6)}
                    </Link>
                  )}
                </div>
                <ul className="divide-y divide-line px-5">
                  {o.lines.map((l, j) => {
                    const c = catalog[l.itemId];
                    return (
                      <li key={j} className="flex items-center gap-4 py-3">
                        <span className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-line">
                          {c && <Image src={`/products/${c.slug}.jpg`} alt="" fill sizes="72px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          {c ? <Link href={`/item/${c.slug}`} className="font-semibold hover:underline">{c.name}</Link> : <span className="font-semibold">Item #{l.itemId}</span>}
                          <span className="block text-sm text-muted">{l.qty} × {fmtMart(l.price)} MART</span>
                        </span>
                        <span className="font-semibold tabular-nums">{fmtMart(l.qty * l.price)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between border-t border-line px-5 py-3">
                  <span className="text-sm text-muted">Paid</span>
                  <Price value={o.total} className="text-lg" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
