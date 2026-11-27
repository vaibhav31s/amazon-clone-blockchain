import raw from "./catalog.json";

export type CatalogEntry = {
  slug: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  rating: number;
  blurb: string;
  description: string;
  specs: string[];
};

/** A catalogue entry merged with what the shop contract says right now. */
export type Product = CatalogEntry & {
  id: number; // the item id on-chain (its position in the catalogue)
  sold: number;
  active: boolean;
  image: string;
};

export const catalog = raw as CatalogEntry[];
export const categories = Array.from(new Set(catalog.map((c) => c.category)));

export function baseProduct(id: number): Product {
  const c = catalog[id];
  return { ...c, id, sold: 0, active: true, image: `/products/${c.slug}.jpg` };
}

export function fmtMart(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
