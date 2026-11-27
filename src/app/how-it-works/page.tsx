import type { Metadata } from "next";
import Link from "next/link";
import { COIN, SHOP } from "@/lib/chain";

export const metadata: Metadata = { title: "How it works", description: "What is real, what is pretend, and how BlockMart is built." };

const steps: [string, string][] = [
  ["The shop is a smart contract", "A normal shop keeps prices, stock and orders in a database only the owner can see or change. BlockMart keeps them in a small program on a blockchain. Anyone can read it, and it follows the same rules for everyone."],
  ["You pay with MART coins", "A second contract is the coin. It sells MART at a fixed price of 0.0001 test ETH each, so the exchange rate cannot be quietly changed."],
  ["Checkout is one transaction", "When you pay, the shop contract checks every item is in stock, takes the coins, lowers the stock and files your order, all in one step. If any part fails, none of it happens and you are not charged."],
  ["Your wallet is your account", "There is no sign-up or password. Your orders are stored against your wallet address, so they show up wherever you connect that wallet."],
  ["Everything is on the ledger", "Each purchase gets a transaction ID. Open it on the Ledger page to see who paid, what was bought, in which block, and what the network fee was."],
];

export default function HowItWorks() {
  return (
    <div className="wrap max-w-3xl pt-8 sm:pt-12">
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">How it works</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">BlockMart is a demo of an online shop that has no private database. Here is what happens behind the buttons.</p>

      <ol className="mt-10 grid gap-4">
        {steps.map(([t, d], i) => (
          <li key={t} className="card flex gap-4 p-5 sm:p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint font-display text-lg font-extrabold text-green-deep">{i + 1}</span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">{t}</h2>
              <p className="mt-1.5 leading-relaxed text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">What is real and what is pretend</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-display text-lg font-bold text-green-deep">Real</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
              <li>The contracts are real Solidity code running on an Ethereum-compatible chain.</li>
              <li>Every purchase is a signed transaction, mined into a block.</li>
              <li>Stock really runs out, and the contract really refuses orders you cannot pay for.</li>
              <li>MetaMask works with it, like on any other network.</li>
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="font-display text-lg font-bold text-coral">Pretend</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-relaxed">
              <li>The chain is a private test network that this site runs for itself. It is not Ethereum mainnet.</li>
              <li>Test ETH and MART coins are free and have no value.</li>
              <li>The products are made up. Nothing is shipped.</li>
              <li>The chain may be reset now and then, which clears balances and orders.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Under the hood</h2>
        <dl className="card mt-5 divide-y divide-line px-5 text-sm">
          {[
            ["Contracts", "Solidity 0.8, tested with Foundry"],
            ["Website", "Next.js, TypeScript, Tailwind CSS, viem"],
            ["Demo wallet", "A key made in your browser. It signs transactions locally and never leaves your device"],
            ["Coin contract", COIN],
            ["Shop contract", SHOP],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:justify-between sm:gap-6">
              <dt className="shrink-0 text-muted">{k}</dt>
              <dd className={`sm:text-right ${v.startsWith("0x") ? "hash break-all" : ""}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          The source code is on{" "}
          <a className="font-medium text-ink underline underline-offset-4" href="https://github.com/vaibhav31s/amazon-clone-blockchain" target="_blank" rel="noopener">GitHub</a>.
        </p>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/#shop" className="btn btn-primary">Go shopping</Link>
        <Link href="/ledger" className="btn btn-ghost">Open the ledger</Link>
      </div>
    </div>
  );
}
