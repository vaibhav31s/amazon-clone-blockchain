# BlockMart

A demo online shop with no private database. Prices, stock and every order live in a smart contract, you pay with the shop's own coin, and each purchase is a transaction you can open on the built-in ledger.

**Live:** https://shop.vaibhavgawad.com

This started in 2022 as a tutorial-style "Amazon clone" on Moralis. Moralis shut that service down, so the app was rebuilt from scratch in 2026 with its own name, design and contracts.

## What you can do

- **Get a wallet in one click.** A demo wallet is created in your browser and topped up with free test ETH. MetaMask works too.
- **Buy MART coins** from the coin contract at a fixed price (1 MART = 0.0001 test ETH).
- **Check out a whole cart in one transaction.** The shop contract checks stock, takes payment and stores the order together, or does nothing at all.
- **See your orders**, read from the contract by wallet address.
- **Browse the ledger**: every transaction, explained in plain English.

Nothing is really for sale. Test ETH and MART have no value.

## How it is built

| Part | What |
| --- | --- |
| `contracts/` | Solidity 0.8 contracts (`MartCoin`, `BlockMart`) and Foundry tests |
| `src/app` | Next.js App Router pages and two API routes |
| `src/app/api/rpc` | A filtered JSON-RPC proxy: browsers and MetaMask talk to this, never to the node |
| `src/app/api/faucet` | Sends test ETH to new wallets |
| `src/components/store.tsx` | Wallet (demo key or MetaMask), cart and transaction state, using viem |
| `scripts/deploy.mjs` | Deploys both contracts and lists the catalogue on-chain |

The chain is a small private Ethereum-compatible test network (Foundry's `anvil`) that only the site's server can reach directly.

## Run it yourself

You need Node 22+ and [Foundry](https://getfoundry.sh).

```bash
npm install
anvil --port 8546 --chain-id 7357031          # in another terminal
cd contracts && forge install foundry-rs/forge-std --no-git && forge test && cd ..
RPC_URL=http://127.0.0.1:8546 OWNER_PRIVATE_KEY=<an anvil key> npm run contracts:deploy
cp .env.example .env.local                      # set FAUCET_PRIVATE_KEY to another anvil key
npm run dev
```

Product photos are CC0 images from StockSnap.
