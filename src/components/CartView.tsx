"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtMart, type Product } from "@/lib/catalog";
import { short } from "@/lib/chain";
import { Arrow, Check, Cube, Minus, Plus, Trash } from "./icons";
import { Price } from "./Price";
import { useStore } from "./store";

type Done = { orderId: number | null; hash: string; block: number; total: number; count: number };

export function CartView({ products, live }: { products: Product[]; live: boolean }) {
  const s = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const lines = s.cart
    .map((l) => ({ ...l, p: products[l.id] }))
    .filter((l) => l.p);
  const total = lines.reduce((n, l) => n + l.p.price * l.qty, 0);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const problems = lines.filter((l) => !l.p.active || l.p.stock < l.qty);
  const shortBy = Math.max(0, total - s.mart);

  async function pay() {
    setBusy(true);
    try {
      const { receipt, orderId } = await s.checkout(lines.map((l) => ({ id: l.id, qty: l.qty })));
      setDone({ orderId, hash: receipt.transactionHash, block: Number(receipt.blockNumber), total, count });
      s.clearCart();
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="wrap max-w-2xl pt-12 text-center sm:pt-20">
        <div className="pop mx-auto grid h-20 w-20 place-items-center rounded-full bg-green text-white">
          <Check width={38} height={38} strokeWidth={2.6} />
        </div>
        <h1 className="rise mt-6 font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Order {done.orderId !== null ? `#${done.orderId} ` : ""}is on the chain.</h1>
        <p className="rise mx-auto mt-4 max-w-md text-lg text-muted">
          {done.count} {done.count === 1 ? "item" : "items"} for {fmtMart(done.total)} MART. The shop contract checked the stock, took the coins and filed your order in one transaction.
        </p>
        <div className="card rise mx-auto mt-8 max-w-md p-5 text-left">
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Transaction</dt>
              <dd><Link href={`/ledger/tx/${done.hash}`} className="hash text-green-deep underline underline-offset-4">{short(done.hash, 8)}</Link></dd>
            </div>
            <div className="flex items-center justify-between gap-4"><dt className="text-muted">Block</dt><dd className="hash">#{done.block}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-muted">Paid</dt><dd><Price value={done.total} /></dd></div>
          </dl>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/orders" className="btn btn-primary">See your orders</Link>
          <Link href={`/ledger/tx/${done.hash}`} className="btn btn-ghost"><Cube width={16} height={16} /> View the receipt</Link>
        </div>
      </div>
    );
  }

  if (s.ready && lines.length === 0) {
    return (
      <div className="wrap max-w-xl pt-16 text-center sm:pt-24">
        <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em]">Your cart is empty.</h1>
        <p className="mt-3 text-lg text-muted">Find something you like and it will wait for you here.</p>
        <Link href="/#shop" className="btn btn-primary mt-7">Browse the shop <Arrow width={18} height={18} /></Link>
      </div>
    );
  }

  return (
    <div className="wrap pt-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_23rem] lg:items-start">
        <ul className="grid gap-3">
          {lines.map(({ p, qty }) => {
            const bad = !p.active || p.stock < qty;
            return (
              <li key={p.id} className={`card flex gap-4 p-3 sm:p-4 ${bad ? "!border-coral" : ""}`}>
                <Link href={`/item/${p.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-line sm:h-28 sm:w-36">
                  <Image src={p.image} alt="" fill sizes="144px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/item/${p.slug}`} className="font-display font-bold leading-snug tracking-tight hover:underline sm:text-lg">{p.name}</Link>
                    <button onClick={() => s.removeFromCart(p.id)} aria-label={`Remove ${p.name}`} className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-coral">
                      <Trash width={17} height={17} />
                    </button>
                  </div>
                  <p className="text-sm text-muted">{fmtMart(p.price)} MART each</p>
                  {bad && <p className="mt-1 text-sm font-medium text-[#a03a1c]">{p.stock <= 0 || !p.active ? "This just sold out. Remove it to continue." : `Only ${p.stock} left. Lower the quantity.`}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex h-10 items-center rounded-full border-[1.5px] border-line" role="group" aria-label={`Quantity of ${p.name}`}>
                      <button onClick={() => s.setQty(p.id, qty - 1)} aria-label="One less" className="grid h-10 w-9 place-items-center"><Minus width={14} height={14} /></button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
                      <button onClick={() => s.setQty(p.id, qty + 1)} disabled={qty >= Math.min(p.stock, 99)} aria-label="One more" className="grid h-10 w-9 place-items-center disabled:opacity-30"><Plus width={14} height={14} /></button>
                    </div>
                    <Price value={p.price * qty} className="text-lg" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card p-5 lg:sticky lg:top-24" aria-label="Order summary">
          <h2 className="font-display text-xl font-bold tracking-tight">Summary</h2>
          <dl className="mt-4 grid gap-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Items ({count})</dt><dd className="tabular-nums">{fmtMart(total)} MART</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free (it is a demo)</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Network fee</dt><dd>A tiny bit of test ETH</dd></div>
            <div className="mt-2 flex items-center justify-between border-t border-line pt-4"><dt className="font-semibold">Total</dt><dd><Price value={total} className="text-2xl" /></dd></div>
          </dl>

          {s.address && (
            <p className="mt-4 flex justify-between rounded-xl bg-paper px-3 py-2.5 text-sm">
              <span className="text-muted">Your balance</span>
              <span className={`font-semibold tabular-nums ${shortBy > 0 ? "text-[#a03a1c]" : "text-green-deep"}`}>{fmtMart(s.mart)} MART</span>
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {!live ? (
              <p className="rounded-xl bg-coral/10 px-3 py-2.5 text-sm text-[#a03a1c]">The chain is offline right now, so checkout is paused.</p>
            ) : !s.address ? (
              <button className="btn btn-primary w-full !py-3.5" onClick={() => s.setConnectOpen(true)}>Connect a wallet to pay</button>
            ) : shortBy > 0 ? (
              <>
                <button className="btn btn-primary w-full !py-3.5" onClick={() => s.openBuy(Math.ceil(shortBy / 50) * 50)}>Get {fmtMart(Math.ceil(shortBy))} more MART</button>
                <p className="text-center text-xs text-muted">You need a few more coins before you can pay.</p>
              </>
            ) : (
              <button className="btn btn-primary w-full !py-3.5" disabled={busy || problems.length > 0} onClick={pay}>
                {busy && <span className="spinner" />}
                {busy ? "Placing your order…" : `Pay ${fmtMart(total)} MART`}
              </button>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted">One transaction. If anything fails, nothing is charged.</p>
        </aside>
      </div>
    </div>
  );
}
