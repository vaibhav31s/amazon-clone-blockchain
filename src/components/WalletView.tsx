"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHAIN_ID, CHAIN_NAME, COIN, ETH_PER_MART, SHOP } from "@/lib/chain";
import { fmtMart } from "@/lib/catalog";
import { Check, Copy, Drop, MartMark } from "./icons";
import { useStore } from "./store";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setOk(true);
            setTimeout(() => setOk(false), 1500);
          } catch {}
        }}
        className="hash flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-right hover:bg-paper"
        aria-label={`Copy ${label}`}
      >
        <span className="truncate">{value}</span>
        {ok ? <Check width={14} height={14} className="shrink-0 text-green" /> : <Copy width={14} height={14} className="shrink-0 text-muted" />}
      </button>
    </div>
  );
}

export function WalletView() {
  const s = useStore();
  const [dripping, setDripping] = useState(false);
  const [rpc, setRpc] = useState("https://shop.vaibhavgawad.com/api/rpc");
  useEffect(() => setRpc(`${window.location.origin}/api/rpc`), []);

  return (
    <div className="wrap max-w-4xl pt-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">Wallet</h1>

      {!s.ready ? null : !s.address ? (
        <div className="card mt-8 px-6 py-12 text-center">
          <p className="font-display text-xl font-bold">No wallet connected yet.</p>
          <p className="mx-auto mt-2 max-w-sm text-muted">A demo wallet takes one click and comes with free test ETH.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn btn-primary" disabled={s.connecting} onClick={() => void s.startDemo()}>
              {s.connecting && <span className="spinner" />} Use a demo wallet
            </button>
            <button className="btn btn-ghost" onClick={() => s.setConnectOpen(true)}>Other options</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rise rounded-[1.5rem] bg-green p-6 text-white">
              <p className="text-sm font-medium text-white/75">MART coins</p>
              <p className="mt-2 flex items-center gap-2.5 font-display text-5xl font-extrabold tabular-nums tracking-tight">
                <MartMark /> {fmtMart(s.mart)}
              </p>
              <p className="mt-1 text-sm text-white/75">The shop's money. 1 MART costs {ETH_PER_MART} test ETH.</p>
              <button className="btn mt-6 bg-white text-green-deep hover:bg-sun hover:text-ink" onClick={() => s.openBuy()}>Get more MART</button>
            </div>
            <div className="card rise p-6" style={{ animationDelay: "60ms" }}>
              <p className="text-sm font-medium text-muted">Test ETH</p>
              <p className="mt-2 font-display text-5xl font-extrabold tabular-nums tracking-tight">{s.eth.toLocaleString("en-IN", { maximumFractionDigits: 4 })}</p>
              <p className="mt-1 text-sm text-muted">Pays for coins and network fees. It is free and worth nothing.</p>
              <button
                className="btn btn-ghost mt-6"
                disabled={dripping}
                onClick={async () => {
                  setDripping(true);
                  await s.requestTestEth();
                  setDripping(false);
                }}
              >
                {dripping ? <span className="spinner" /> : <Drop width={16} height={16} />} Get free test ETH
              </button>
            </div>
          </div>

          <div className="card mt-4 px-5 py-3">
            <div className="flex items-center justify-between gap-3 border-b border-line py-2.5">
              <span className="text-sm text-muted">Wallet type</span>
              <span className="rounded-full bg-mint px-3 py-1 text-sm font-semibold text-green-deep">{s.mode === "demo" ? "Demo wallet (lives in this browser)" : "MetaMask"}</span>
            </div>
            <CopyRow label="Your address" value={s.address} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
              <Link href="/orders" className="text-sm font-semibold text-green-deep underline-offset-4 hover:underline">See this wallet's orders</Link>
              <button className="text-sm font-medium text-muted underline-offset-4 hover:text-coral hover:underline" onClick={s.disconnect}>Disconnect</button>
            </div>
          </div>
          {s.mode === "demo" && <p className="mt-3 text-sm text-muted">Your demo wallet's key is saved only in this browser. Clear your browser data and the wallet, with its coins, is gone. That is fine here, because none of it is real.</p>}
        </>
      )}

      <section className="mt-12" aria-label="Network details">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Network details</h2>
        <p className="mt-2 max-w-2xl text-muted">BlockMart runs on its own small Ethereum-style test network. MetaMask is set up automatically when you connect, or you can add the network by hand with these details.</p>
        <div className="card mt-5 divide-y divide-line px-5 py-1">
          <CopyRow label="Network name" value={CHAIN_NAME} />
          <CopyRow label="RPC URL" value={rpc} />
          <CopyRow label="Chain ID" value={String(CHAIN_ID)} />
          <CopyRow label="Currency symbol" value="ETH" />
          <CopyRow label="Coin contract (MART)" value={COIN} />
          <CopyRow label="Shop contract" value={SHOP} />
        </div>
      </section>
    </div>
  );
}
