import Image from "next/image";
import Link from "next/link";
import { HeroActions } from "@/components/HeroActions";
import { ShopGrid } from "@/components/ShopGrid";
import { Cube } from "@/components/icons";
import { categories, fmtMart } from "@/lib/catalog";
import { ago, getLedger } from "@/lib/ledger";
import { getProducts } from "@/lib/server-chain";
import { short } from "@/lib/chain";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ products, live }, ledger] = await Promise.all([getProducts(), getLedger(8).catch(() => null)]);
  const recent = ledger?.rows.filter((r) => r.kind === "order" || r.kind === "coins").slice(0, 3) ?? [];
  const hero = [products[5], products[0], products[10]];

  return (
    <>
      {!live && (
        <div className="bg-coral/15 py-2.5 text-center text-sm font-medium text-[#8f3317]">
          The BlockMart chain is not answering right now, so buying is paused. You can still look around.
        </div>
      )}
      <section className="wrap grid gap-10 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div className="rise">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full ${live ? "animate-ping bg-green/60" : "bg-coral"}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-green" : "bg-coral"}`} />
            </span>
            {live && ledger ? `Chain live · block #${ledger.head.toLocaleString("en-IN")}` : "Chain offline"}
          </p>
          <h1 className="font-display text-[2.7rem] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[4.4rem]">
            A shop where every order is{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">on the record.</span>
              <span aria-hidden className="absolute inset-x-0 bottom-1 z-0 h-[0.36em] rounded-sm bg-sun" />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            BlockMart keeps its prices, stock and orders in a smart contract instead of a private database. Pay with MART coins, then look up your order on the public ledger. It is a demo, so the money is pretend.
          </p>
          <HeroActions />
          {ledger && (
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                ["Orders placed", ledger.orders.toLocaleString("en-IN")],
                ["MART coins issued", fmtMart(Math.round(ledger.supply))],
                ["Blocks", ledger.head.toLocaleString("en-IN")],
              ].map(([k, v]) => (
                <div key={k}>
                  <dd className="font-display text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{v}</dd>
                  <dt className="mt-0.5 text-xs text-muted sm:text-sm">{k}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="rise relative mx-auto w-full max-w-lg lg:max-w-none" style={{ animationDelay: "120ms" }}>
          <div className="grid grid-cols-5 grid-rows-6 gap-3 sm:gap-4" style={{ aspectRatio: "1 / 0.92" }}>
            <Link href={`/item/${hero[0].slug}`} className="relative col-span-3 row-span-6 overflow-hidden rounded-[1.75rem] bg-line">
              <Image src={hero[0].image} alt={hero[0].name} fill priority sizes="(min-width:1024px) 30vw, 60vw" className="object-cover transition-transform duration-700 hover:scale-105" />
            </Link>
            <Link href={`/item/${hero[1].slug}`} className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] bg-line">
              <Image src={hero[1].image} alt={hero[1].name} fill priority sizes="(min-width:1024px) 20vw, 40vw" className="object-cover transition-transform duration-700 hover:scale-105" />
            </Link>
            <Link href={`/item/${hero[2].slug}`} className="relative col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] bg-line">
              <Image src={hero[2].image} alt={hero[2].name} fill priority sizes="(min-width:1024px) 20vw, 40vw" className="object-cover transition-transform duration-700 hover:scale-105" />
            </Link>
          </div>
          {recent.length > 0 && (
            <div className="card absolute -bottom-6 left-3 right-3 p-3 shadow-xl sm:left-auto sm:right-[-0.75rem] sm:w-80">
              <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                <Cube width={13} height={13} /> Latest on the ledger
              </p>
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.hash}>
                    <Link href={`/ledger/tx/${r.hash}`} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-paper">
                      <span className="min-w-0">
                        <span className="font-semibold">{r.label}</span>
                        <span className="block truncate text-xs text-muted">{r.detail}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="hash block text-green-deep">{short(r.hash, 3)}</span>
                        <span className="block text-[11px] text-muted">{ago(r.time)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="wrap mt-20 grid gap-3 sm:mt-24 sm:grid-cols-3" aria-label="How it works">
        {[
          ["1", "Get a wallet", "One click makes a demo wallet in your browser and fills it with free test ETH."],
          ["2", "Swap for MART", "The coin contract sells MART at a fixed price. That is the shop's money."],
          ["3", "Check out on-chain", "Your whole cart is one transaction. The contract checks stock, takes payment and files the order."],
        ].map(([n, t, d]) => (
          <div key={n} className="card flex gap-4 p-5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-display font-extrabold text-green-deep">{n}</span>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">{t}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          </div>
        ))}
      </section>

      <ShopGrid products={products} categories={categories} />
    </>
  );
}
