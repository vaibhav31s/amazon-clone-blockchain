import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { Header } from "@/components/Header";
import { Overlays } from "@/components/Overlays";
import Link from "next/link";

const body = Inter({ subsets: ["latin"], variable: "--ff-body" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--ff-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.vaibhavgawad.com"),
  title: { default: "BlockMart — a shop that runs on a blockchain", template: "%s · BlockMart" },
  description:
    "A demo shop where prices, stock and every order live in a smart contract. Try it in seconds with a free demo wallet. No real money involved.",
  openGraph: { title: "BlockMart", description: "A shop that runs on a blockchain. Try it with a free demo wallet.", type: "website" },
};
export const viewport: Viewport = { themeColor: "#f4f1e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable}`}>
      <body className="flex flex-col antialiased">
        <StoreProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="mt-20 border-t border-line">
            <div className="wrap flex flex-col gap-3 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                BlockMart is a portfolio demo by{" "}
                <a className="font-medium text-ink underline-offset-4 hover:underline" href="https://vaibhavgawad.com" target="_blank" rel="noopener">
                  Vaibhav Gawad
                </a>
                . Nothing here is really for sale and no real money is used.
              </p>
              <nav className="flex gap-5">
                <Link className="hover:text-ink" href="/how-it-works">How it works</Link>
                <Link className="hover:text-ink" href="/ledger">Ledger</Link>
                <Link className="hover:text-ink" href="/wallet">Wallet</Link>
              </nav>
            </div>
          </footer>
          <Overlays />
        </StoreProvider>
      </body>
    </html>
  );
}
