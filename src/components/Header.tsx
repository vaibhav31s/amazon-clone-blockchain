"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { short } from "@/lib/chain";
import { fmtMart } from "@/lib/catalog";
import { Bag, Logo, MartMark, Wallet } from "./icons";
import { useStore } from "./store";

const links = [
  { href: "/", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/ledger", label: "Ledger" },
  { href: "/how-it-works", label: "How it works" },
];

export function Header() {
  const path = usePathname();
  const s = useStore();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/item") : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center gap-3">
        <Link href="/" aria-label="BlockMart home" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(l.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${active(l.href) ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {s.ready && s.address ? (
            <Link href="/wallet" className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-3 pr-1.5 text-sm transition-colors hover:border-ink" aria-label={`Wallet: ${fmtMart(s.mart)} MART`}>
              <span className="flex items-center gap-1.5 font-display font-bold tabular-nums">
                <MartMark />
                {fmtMart(Math.floor(s.mart))}
              </span>
              <span className="hash hidden rounded-full bg-mint px-2.5 py-1 text-green-deep sm:inline">{short(s.address)}</span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-mint text-green-deep sm:hidden">
                <Wallet width={15} height={15} />
              </span>
            </Link>
          ) : (
            <button className="btn btn-dark !py-2.5 !text-sm" onClick={() => s.setConnectOpen(true)}>
              <Wallet width={16} height={16} />
              <span className="hidden sm:inline">Connect wallet</span>
              <span className="sm:hidden">Connect</span>
            </button>
          )}
          <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-ink" aria-label={`Cart, ${s.cartCount} items`}>
            <Bag />
            {s.ready && s.cartCount > 0 && (
              <span key={s.cartCount} className="pop absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">
                {s.cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="wrap flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Main">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${active(l.href) ? "bg-ink text-paper" : "text-muted"}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
