"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { Minus, Plus } from "./icons";
import { Price } from "./Price";
import { useStore } from "./store";

export function BuyBox({ p, live }: { p: Product; live: boolean }) {
  const s = useStore();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const soldOut = p.stock <= 0 || !p.active;
  const max = Math.min(p.stock, 99);

  return (
    <div className="mt-7 border-y border-line py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Price value={p.price} className="text-4xl" />
          <p className="mt-1 text-sm text-muted">≈ {(p.price * 0.0001).toLocaleString("en-IN", { maximumFractionDigits: 4 })} test ETH</p>
        </div>
        <p className={`rounded-full px-3 py-1 text-sm font-semibold ${soldOut ? "bg-ink text-paper" : p.stock <= 10 ? "bg-coral/15 text-[#a03a1c]" : "bg-mint text-green-deep"}`}>
          {soldOut ? "Sold out" : p.stock <= 10 ? `Only ${p.stock} left` : "In stock"}
        </p>
      </div>
      {!soldOut && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex h-12 items-center rounded-full border-[1.5px] border-line bg-surface" role="group" aria-label="Quantity">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One less" className="grid h-12 w-11 place-items-center rounded-l-full disabled:opacity-30">
              <Minus width={16} height={16} />
            </button>
            <span className="w-7 text-center font-display font-bold tabular-nums" aria-live="polite">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} aria-label="One more" className="grid h-12 w-11 place-items-center rounded-r-full disabled:opacity-30">
              <Plus width={16} height={16} />
            </button>
          </div>
          <button
            className="btn btn-dark h-12 flex-1"
            onClick={() => {
              s.addToCart(p.id, qty);
              s.say(`${qty} × ${p.name} added to your cart.`);
            }}
          >
            Add to cart
          </button>
          <button
            className="btn btn-primary h-12 flex-1"
            disabled={!live}
            onClick={() => {
              s.addToCart(p.id, qty);
              router.push("/cart");
            }}
          >
            Buy now
          </button>
        </div>
      )}
    </div>
  );
}
