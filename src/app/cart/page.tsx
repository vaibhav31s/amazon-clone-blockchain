import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { getProducts } from "@/lib/server-chain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const { products, live } = await getProducts();
  return <CartView products={products} live={live} />;
}
