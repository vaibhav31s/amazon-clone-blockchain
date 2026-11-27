"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

type Sort = "featured" | "low" | "high" | "popular";

export function ShopGrid({ products, categories }: { products: Product[]; categories: string[] }) {
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<Sort>("featured");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = products.filter((p) => (cat === "All" || p.category === cat) && (!needle || `${p.name} ${p.blurb} ${p.category}`.toLowerCase().includes(needle)));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "popular") list = [...list].sort((a, b) => b.sold - a.sold || b.rating - a.rating);
    return list;
  }, [products, cat, sort, q]);

  return (
    <section id="shop" className="wrap scroll-mt-28 pt-12" aria-label="Products">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
          {["All", ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors ${cat === c ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="q">Search products</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the shop" className="h-11 w-full min-w-0 rounded-full border-[1.5px] border-line bg-surface px-4 text-sm outline-none placeholder:text-muted focus:border-green lg:w-56" />
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 shrink-0 rounded-full border-[1.5px] border-line bg-surface px-3 text-sm font-medium outline-none focus:border-green">
            <option value="featured">Featured</option>
            <option value="popular">Most bought</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="card px-6 py-14 text-center text-muted">Nothing matches that. Try another word or category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p, i) => (
            <div key={p.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <ProductCard p={p} priority={i < 4} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
