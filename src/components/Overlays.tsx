"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ETH_PER_MART, short } from "@/lib/chain";
import { fmtMart } from "@/lib/catalog";
import { Check, Cube, MartMark, Wallet, X } from "./icons";
import { useStore } from "./store";

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 backdrop-blur-[2px] sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="pop card w-full max-w-md p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConnectDialog() {
  const s = useStore();
  return (
    <Dialog open={s.connectOpen} onClose={() => s.setConnectOpen(false)} title="Pick a wallet">
      <p className="mb-5 text-sm text-muted">A wallet is your account here. It holds your coins and signs your orders.</p>
      <div className="grid gap-3">
        <button disabled={s.connecting} onClick={() => void s.startDemo()} className="group rounded-2xl border-2 border-green bg-mint/60 p-4 text-left transition-colors hover:bg-mint disabled:opacity-60">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-lg font-bold">Use a demo wallet</span>
            <span className="rounded-full bg-green px-2.5 py-0.5 text-xs font-semibold text-white">Instant</span>
          </div>
          <p className="mt-1 text-sm text-muted">Made in your browser in one click, and topped up with free test ETH. Nothing to install.</p>
          {s.connecting && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-deep">
              <span className="spinner" /> Setting up your wallet…
            </p>
          )}
        </button>
        <button disabled={s.connecting || !s.hasInjected} onClick={() => void s.connectInjected()} className="rounded-2xl border-2 border-line p-4 text-left transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line">
          <span className="font-display text-lg font-bold">Connect MetaMask</span>
          <p className="mt-1 text-sm text-muted">
            {s.hasInjected ? "Use your own browser wallet. We add the BlockMart test network for you." : "No browser wallet found on this device. The demo wallet works everywhere."}
          </p>
        </button>
      </div>
      <p className="mt-4 text-xs text-muted">This shop runs on its own test network. The coins have no value and nothing is shipped.</p>
    </Dialog>
  );
}

function BuyDialog() {
  const s = useStore();
  const [amount, setAmount] = useState(500);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (s.buyOpen) setAmount(s.buySuggest);
  }, [s.buyOpen, s.buySuggest]);

  const cost = amount * ETH_PER_MART;
  const tooMuch = cost > s.eth - 0.001;
  const presets = Array.from(new Set([100, 500, 2000, s.buySuggest])).sort((a, b) => a - b);

  async function go() {
    setBusy(true);
    try {
      await s.buyCoins(amount);
      s.closeBuy();
    } catch {
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={s.buyOpen} onClose={s.closeBuy} title="Get MART coins">
      <p className="mb-4 text-sm text-muted">Everything in the shop is priced in MART. The coin contract sells them at a fixed rate: 1 MART for {ETH_PER_MART} test ETH.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p} onClick={() => setAmount(p)} aria-pressed={amount === p} className={`rounded-full border-2 px-4 py-2 text-sm font-semibold tabular-nums transition-colors ${amount === p ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
            {fmtMart(p)}
          </button>
        ))}
      </div>
      <label className="block text-sm font-medium" htmlFor="mart-amount">
        Amount
      </label>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border-2 border-line bg-white px-4 focus-within:border-green">
        <MartMark className="text-xl" />
        <input
          id="mart-amount"
          inputMode="numeric"
          value={amount || ""}
          onChange={(e) => setAmount(Math.min(1_000_000, Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0))))}
          className="w-full bg-transparent py-3 font-display text-2xl font-bold tabular-nums outline-none"
        />
        <span className="text-sm font-medium text-muted">MART</span>
      </div>
      <dl className="mt-4 grid gap-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">You pay</dt>
          <dd className="font-medium tabular-nums">{cost.toLocaleString("en-IN", { maximumFractionDigits: 4 })} test ETH</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">You have</dt>
          <dd className="tabular-nums">{s.eth.toLocaleString("en-IN", { maximumFractionDigits: 4 })} test ETH</dd>
        </div>
      </dl>
      {tooMuch && amount > 0 && (
        <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-[#a03a1c]">
          That is more test ETH than you have.{" "}
          <button className="font-semibold underline underline-offset-2" onClick={() => void s.requestTestEth()}>
            Get 1 free test ETH
          </button>
        </p>
      )}
      <button disabled={busy || amount <= 0 || tooMuch} onClick={go} className="btn btn-primary mt-5 w-full !py-3.5">
        {busy ? <span className="spinner" /> : null}
        {busy ? "Confirming on-chain…" : `Buy ${fmtMart(amount)} MART`}
      </button>
    </Dialog>
  );
}

function TxToast() {
  const { tx, clearTx } = useStore();
  useEffect(() => {
    if (tx?.stage === "confirmed") {
      const t = setTimeout(clearTx, 9000);
      return () => clearTimeout(t);
    }
  }, [tx, clearTx]);
  if (!tx) return null;
  const done = tx.stage === "confirmed";
  const failed = tx.stage === "failed";
  return (
    <div role="status" aria-live="polite" className="pop fixed bottom-4 left-4 right-4 z-[60] sm:left-auto sm:w-[23rem]">
      <div className="card flex gap-3 p-4 shadow-xl">
        <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${done ? "bg-green text-white" : failed ? "bg-coral text-white" : "bg-mint text-green-deep"}`}>
          {done ? <Check width={18} height={18} /> : failed ? <X width={18} height={18} /> : <span className="spinner" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{tx.title}</p>
          <p className="mt-0.5 text-sm text-muted">
            {tx.stage === "signing" && "Signing with your wallet…"}
            {tx.stage === "pending" && "Sent. Waiting for it to be added to a block…"}
            {done && `Confirmed in block #${tx.block}.`}
            {failed && tx.error}
          </p>
          {tx.hash && (
            <Link href={`/ledger/tx/${tx.hash}`} onClick={clearTx} className="hash mt-1.5 inline-flex items-center gap-1.5 text-green-deep underline-offset-4 hover:underline">
              <Cube width={13} height={13} /> {short(tx.hash, 6)}
            </Link>
          )}
        </div>
        {(done || failed) && (
          <button onClick={clearTx} aria-label="Dismiss" className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink">
            <X width={16} height={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function Notice() {
  const { notice, tx } = useStore();
  if (!notice) return null;
  return (
    <div role="status" aria-live="polite" className={`pop pointer-events-none fixed left-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 ${tx ? "bottom-32" : "bottom-5"}`}>
      <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-xl">
        <Wallet width={15} height={15} className="shrink-0 text-sun" />
        <span>{notice}</span>
      </div>
    </div>
  );
}

export function Overlays() {
  return (
    <>
      <ConnectDialog />
      <BuyDialog />
      <TxToast />
      <Notice />
    </>
  );
}
