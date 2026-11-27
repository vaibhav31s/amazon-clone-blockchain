"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  formatEther,
  http,
  parseEther,
  type Abi,
  type EIP1193Provider,
  type TransactionReceipt,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { blockmartChain, CHAIN_ID, CHAIN_NAME, COIN, coinAbi, SHOP, shopAbi } from "@/lib/chain";

const KEY_DEMO = "blockmart:demo-key";
const KEY_MODE = "blockmart:mode";
const KEY_CART = "blockmart:cart";

export type Mode = "none" | "demo" | "injected";
export type CartLine = { id: number; qty: number };
export type TxState = {
  title: string;
  stage: "signing" | "pending" | "confirmed" | "failed";
  hash?: `0x${string}`;
  block?: number;
  error?: string;
};

type Store = {
  ready: boolean;
  mode: Mode;
  address: `0x${string}` | null;
  eth: number;
  mart: number;
  hasInjected: boolean;
  connecting: boolean;
  // dialogs
  connectOpen: boolean;
  setConnectOpen: (v: boolean) => void;
  buyOpen: boolean;
  openBuy: (suggest?: number) => void;
  closeBuy: () => void;
  buySuggest: number;
  // wallet actions
  startDemo: () => Promise<void>;
  connectInjected: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  requestTestEth: () => Promise<boolean>;
  buyCoins: (mart: number) => Promise<TransactionReceipt>;
  checkout: (lines: CartLine[]) => Promise<{ receipt: TransactionReceipt; orderId: number | null }>;
  // tx + notices
  tx: TxState | null;
  clearTx: () => void;
  notice: string | null;
  say: (msg: string) => void;
  // cart
  cart: CartLine[];
  cartCount: number;
  addToCart: (id: number, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

const getStored = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const setStored = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {}
};

function injected(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { ethereum?: EIP1193Provider }).ethereum ?? null) as EIP1193Provider | null;
}

/** Turn a wallet/contract error into one plain sentence. */
function friendly(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null;
    const name = revert?.data?.errorName;
    if (name === "InsufficientBalance") return "You don't have enough MART coins for this.";
    if (name === "OutOfStock") return "Someone just bought the last of an item in your cart. Lower the quantity and try again.";
    if (name === "ItemInactive") return "One of these items is no longer for sale.";
    if (name === "NoEthSent") return "Enter an amount first.";
    if (name) return `The contract refused this: ${name}.`;
    const msg = (e.shortMessage || e.message || "").toLowerCase();
    if (msg.includes("user rejected") || msg.includes("user denied")) return "You cancelled it in your wallet.";
    if (msg.includes("insufficient funds")) return "Not enough test ETH to pay for this. Get some from the faucet on the Wallet page.";
    if (msg.includes("http request failed") || msg.includes("fetch")) return "Could not reach the BlockMart chain. Please try again.";
    return e.shortMessage || "The transaction did not go through.";
  }
  const code = (e as { code?: number })?.code;
  if (code === 4001) return "You cancelled it in your wallet.";
  return "Something went wrong. Please try again.";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("none");
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [eth, setEth] = useState(0);
  const [mart, setMart] = useState(0);
  const [hasInjected, setHasInjected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buySuggest, setBuySuggest] = useState(500);
  const [tx, setTx] = useState<TxState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chain = useMemo(() => blockmartChain("/api/rpc"), []);
  const pub = useMemo(() => createPublicClient({ chain, transport: http("/api/rpc"), pollingInterval: 700 }), [chain]);

  const say = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4200);
  }, []);

  const loadBalances = useCallback(
    async (addr: `0x${string}`) => {
      try {
        const [wei, coins] = await Promise.all([
          pub.getBalance({ address: addr }),
          pub.readContract({ address: COIN, abi: coinAbi, functionName: "balanceOf", args: [addr] }) as Promise<bigint>,
        ]);
        setEth(Number(formatEther(wei)));
        setMart(Number(formatEther(coins)));
      } catch {}
    },
    [pub],
  );

  const refresh = useCallback(async () => {
    if (address) await loadBalances(address);
  }, [address, loadBalances]);

  // restore session
  useEffect(() => {
    setHasInjected(!!injected());
    try {
      const saved = JSON.parse(getStored(KEY_CART) || "[]") as CartLine[];
      if (Array.isArray(saved)) setCart(saved.filter((l) => Number.isInteger(l?.id) && l.qty > 0));
    } catch {}

    const m = getStored(KEY_MODE);
    if (m === "demo") {
      const pk = getStored(KEY_DEMO) as `0x${string}` | null;
      if (pk) {
        try {
          const a = privateKeyToAccount(pk).address;
          setMode("demo");
          setAddress(a);
          void loadBalances(a);
        } catch {}
      }
    } else if (m === "injected") {
      const eth = injected();
      eth
        ?.request({ method: "eth_accounts" })
        .then((accs) => {
          const a = (accs as string[])[0] as `0x${string}` | undefined;
          if (a) {
            setMode("injected");
            setAddress(a);
            void loadBalances(a);
          }
        })
        .catch(() => {});
    }
    setReady(true);
  }, [loadBalances]);

  // follow MetaMask account changes
  useEffect(() => {
    if (mode !== "injected") return;
    const eth = injected() as (EIP1193Provider & { on?: Function; removeListener?: Function }) | null;
    if (!eth?.on) return;
    const onAccounts = (accs: string[]) => {
      if (!accs[0]) {
        setMode("none");
        setAddress(null);
        setStored(KEY_MODE, null);
      } else {
        setAddress(accs[0] as `0x${string}`);
        void loadBalances(accs[0] as `0x${string}`);
      }
    };
    eth.on("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, [mode, loadBalances]);

  useEffect(() => {
    if (ready) setStored(KEY_CART, JSON.stringify(cart));
  }, [cart, ready]);

  const drip = useCallback(async (addr: string) => {
    const res = await fetch("/api/faucet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address: addr }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; skipped?: boolean };
    if (!res.ok) throw new Error(data.error || "The faucet is busy. Try again.");
    return data;
  }, []);

  const startDemo = useCallback(async () => {
    setConnecting(true);
    try {
      let pk = getStored(KEY_DEMO) as `0x${string}` | null;
      if (!pk) {
        pk = generatePrivateKey();
        setStored(KEY_DEMO, pk);
      }
      const a = privateKeyToAccount(pk).address;
      setStored(KEY_MODE, "demo");
      setMode("demo");
      setAddress(a);
      setConnectOpen(false);
      try {
        await drip(a);
      } catch (e) {
        say((e as Error).message);
      }
      await loadBalances(a);
      const coins = (await pub.readContract({ address: COIN, abi: coinAbi, functionName: "balanceOf", args: [a] })) as bigint;
      if (coins === 0n) {
        say("Demo wallet ready with 1 test ETH. Now swap some for MART coins.");
        setBuySuggest(500);
        setBuyOpen(true);
      } else {
        say("Welcome back. Your demo wallet is connected.");
      }
    } finally {
      setConnecting(false);
    }
  }, [drip, loadBalances, pub, say]);

  const ensureChain = useCallback(async (eth: EIP1193Provider) => {
    const hex = `0x${CHAIN_ID.toString(16)}` as `0x${string}`;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      const code = (e as { code?: number })?.code;
      if (code === 4001) throw e;
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: hex,
            chainName: CHAIN_NAME,
            nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [`${window.location.origin}/api/rpc`],
            blockExplorerUrls: [`${window.location.origin}/ledger`],
          },
        ],
      });
    }
  }, []);

  const connectInjected = useCallback(async () => {
    const eth = injected();
    if (!eth) {
      say("No browser wallet found. Use the demo wallet instead.");
      return;
    }
    setConnecting(true);
    try {
      const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      await ensureChain(eth);
      const a = accs[0] as `0x${string}`;
      setStored(KEY_MODE, "injected");
      setMode("injected");
      setAddress(a);
      setConnectOpen(false);
      try {
        const d = await drip(a);
        if (!d.skipped) say("Connected. We sent your wallet 1 test ETH to shop with.");
      } catch {}
      await loadBalances(a);
    } catch (e) {
      say(friendly(e));
    } finally {
      setConnecting(false);
    }
  }, [drip, ensureChain, loadBalances, say]);

  const disconnect = useCallback(() => {
    setStored(KEY_MODE, null);
    setMode("none");
    setAddress(null);
    setEth(0);
    setMart(0);
  }, []);

  const requestTestEth = useCallback(async () => {
    if (!address) return false;
    try {
      const d = await drip(address);
      await loadBalances(address);
      say(d.skipped ? "You already have plenty of test ETH." : "1 test ETH sent to your wallet.");
      return true;
    } catch (e) {
      say((e as Error).message);
      return false;
    }
  }, [address, drip, loadBalances, say]);

  const send = useCallback(
    async (title: string, call: { address: `0x${string}`; abi: Abi; functionName: string; args?: unknown[]; value?: bigint }) => {
      if (!address || mode === "none") {
        setConnectOpen(true);
        throw new Error("not connected");
      }
      setTx({ title, stage: "signing" });
      try {
        let hash: `0x${string}`;
        if (mode === "demo") {
          const pk = getStored(KEY_DEMO) as `0x${string}`;
          const wallet = createWalletClient({ account: privateKeyToAccount(pk), chain, transport: http("/api/rpc") });
          hash = await wallet.writeContract({ ...call, chain, args: call.args ?? [] });
        } else {
          const eth = injected();
          if (!eth) throw new Error("wallet gone");
          await ensureChain(eth);
          const wallet = createWalletClient({ account: address, chain, transport: custom(eth) });
          hash = await wallet.writeContract({ ...call, chain, args: call.args ?? [] });
        }
        setTx({ title, stage: "pending", hash });
        const receipt = await pub.waitForTransactionReceipt({ hash, timeout: 30_000 });
        if (receipt.status !== "success") throw new Error("reverted");
        setTx({ title, stage: "confirmed", hash, block: Number(receipt.blockNumber) });
        await loadBalances(address);
        return receipt;
      } catch (e) {
        setTx((t) => ({ title, stage: "failed", hash: t?.hash, error: friendly(e) }));
        throw e;
      }
    },
    [address, mode, chain, pub, ensureChain, loadBalances],
  );

  const buyCoins = useCallback(
    (amount: number) =>
      send(`Buying ${amount.toLocaleString("en-IN")} MART`, {
        address: COIN,
        abi: coinAbi,
        functionName: "buy",
        value: parseEther(String(amount)) / 10000n, // 0.0001 ETH per coin
      }),
    [send],
  );

  const checkout = useCallback(
    async (lines: CartLine[]) => {
      const receipt = await send("Placing your order", {
        address: SHOP,
        abi: shopAbi,
        functionName: "checkout",
        args: [lines.map((l) => l.id), lines.map((l) => l.qty)],
      });
      let orderId: number | null = null;
      try {
        const { parseEventLogs } = await import("viem");
        const logs = parseEventLogs({ abi: shopAbi, logs: receipt.logs, eventName: "OrderPlaced" }) as unknown as {
          args: { orderId: bigint };
        }[];
        if (logs[0]) orderId = Number(logs[0].args.orderId);
      } catch {}
      return { receipt, orderId };
    },
    [send],
  );

  const addToCart = useCallback(
    (id: number, qty = 1) => {
      setCart((c) => {
        const found = c.find((l) => l.id === id);
        if (found) return c.map((l) => (l.id === id ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
        if (c.length >= 20) return c;
        return [...c, { id, qty }];
      });
    },
    [],
  );
  const setQty = useCallback((id: number, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty: Math.min(99, qty) } : l))));
  }, []);
  const removeFromCart = useCallback((id: number) => setCart((c) => c.filter((l) => l.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const value: Store = {
    ready,
    mode,
    address,
    eth,
    mart,
    hasInjected,
    connecting,
    connectOpen,
    setConnectOpen,
    buyOpen,
    openBuy: (suggest) => {
      if (!address) {
        setConnectOpen(true);
        return;
      }
      if (suggest) setBuySuggest(suggest);
      setBuyOpen(true);
    },
    closeBuy: () => setBuyOpen(false),
    buySuggest,
    startDemo,
    connectInjected,
    disconnect,
    refresh,
    requestTestEth,
    buyCoins,
    checkout,
    tx,
    clearTx: () => setTx(null),
    notice,
    say,
    cart,
    cartCount: cart.reduce((n, l) => n + l.qty, 0),
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** A read-only client for client components (orders, wallet). */
export function useChainReader() {
  return useMemo(() => createPublicClient({ chain: blockmartChain("/api/rpc"), transport: http("/api/rpc") }), []);
}
