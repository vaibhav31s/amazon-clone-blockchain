import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyBox } from "@/components/BuyBox";
import { ProductCard } from "@/components/ProductCard";
import { Check, Star } from "@/components/icons";
import { catalog } from "@/lib/catalog";
import { SHOP, short } from "@/lib/chain";
import { getProducts } from "@/lib/server-chain";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = catalog.find((x) => x.slug === slug);
  return c ? { title: c.name, description: c.description } : {};
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const { products, live } = await getProducts();
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const more = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);

  return (
    <div className="wrap pt-6 sm:pt-10">
      <nav className="mb-5 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Shop</Link> <span aria-hidden>/</span> <span>{p.category}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="rise relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-line lg:sticky lg:top-24 lg:self-start">
          <Image src={p.image} alt={p.name} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="rise" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Star width={15} height={15} className="text-sun" />
            <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
            <span aria-hidden>·</span>
            <span>{p.sold > 0 ? `${p.sold} bought on-chain` : "Be the first to buy it"}</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-5xl">{p.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{p.description}</p>

          <BuyBox p={p} live={live} />

          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {p.specs.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint text-green-deep">
                  <Check width={12} height={12} strokeWidth={3} />
                </span>
                {s}
              </li>
            ))}
          </ul>

          <div className="card mt-8 p-5">
            <h2 className="font-display text-lg font-bold tracking-tight">What the contract says</h2>
            <p className="mt-1 text-sm text-muted">These numbers are read straight from the shop contract, not from a database we control.</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div><dt className="text-muted">Item ID</dt><dd className="hash mt-0.5 font-semibold">#{p.id}</dd></div>
              <div><dt className="text-muted">Price</dt><dd className="mt-0.5 font-semibold tabular-nums">{p.price} MART</dd></div>
              <div><dt className="text-muted">In stock</dt><dd className="mt-0.5 font-semibold tabular-nums">{p.stock}</dd></div>
              <div><dt className="text-muted">Sold</dt><dd className="mt-0.5 font-semibold tabular-nums">{p.sold}</dd></div>
            </dl>
            <p className="hash mt-4 break-all text-muted">Shop contract {short(SHOP, 8)}</p>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-20" aria-label="More like this">
          <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight">More from {p.category}</h2>
          <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {more.map((m) => <ProductCard key={m.id} p={m} />)}
          </div>
        </section>
      )}
    </div>
  );
}
