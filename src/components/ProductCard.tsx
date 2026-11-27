"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { Check, Plus, Star } from "./icons";
import { Price } from "./Price";
import { useStore } from "./store";

export function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const s = useStore();
  const inCart = s.cart.find((l) => l.id === p.id)?.qty ?? 0;
  const soldOut = p.stock <= 0 || !p.active;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_18px_40px_-18px_rgba(22,20,15,0.35)]">
      <Link href={`/item/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-line" aria-label={p.name}>
        <Image
          src={p.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] ${soldOut ? "grayscale" : ""}`}
        />
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-paper">Sold out</span>
        ) : p.stock <= 10 ? (
          <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white">Only {p.stock} left</span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center gap-1 text-xs text-muted">
          <Star width={13} height={13} className="text-sun" />
          <span className="font-medium text-ink">{p.rating.toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span>{p.category}</span>
        </div>
        <h3 className="font-display text-[1.05rem] font-bold leading-snug tracking-tight">
          <Link href={`/item/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4">
            {p.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{p.blurb}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <Price value={p.price} className="text-xl" />
          <button
            disabled={soldOut}
            onClick={() => {
              s.addToCart(p.id);
              s.say(`${p.name} added to your cart.`);
            }}
            aria-label={`Add ${p.name} to cart`}
            className={`relative z-10 grid h-10 place-items-center rounded-full px-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${inCart ? "bg-mint text-green-deep" : "bg-ink text-paper hover:bg-green"}`}
          >
            {inCart ? (
              <span className="flex items-center gap-1">
                <Check width={15} height={15} /> {inCart}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus width={15} height={15} /> Add
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
