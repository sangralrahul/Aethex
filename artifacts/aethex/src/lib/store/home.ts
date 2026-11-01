/**
 * Update 105: what aethex.in's home page shows from the store, worked out once from the catalogue. The Worker sends it
 * inside the home page's HTML (worker/seo.ts hubHome) and at /api/store/home, so the home page no longer downloads the
 * whole catalogue (about 430 KB) before it can show a product. The site computes the same from the catalogue if
 * neither is there. Pure code with relative imports only: used by both the site and the Worker.
 */
import type { ProductSummary } from "./types";

export type HomeProduct = Pick<ProductSummary, "id" | "slug" | "name" | "image" | "price" | "mrp" | "from" | "rating" | "offer" | "category" | "brand" | "featured" | "inStock" | "priceOnRequest">;
export interface HomeData {
  version: string;
  stats: { inStock: number; brands: number; categories: number };
  essentials: { slug: string; label: string; from: number; image: string }[];
  latest: HomeProduct[];
  deals: HomeProduct[];
  cats: { slug: string; name: string; image: string; n: number }[];
  rows: { slug: string; name: string; blurb: string; list: HomeProduct[] }[];
  rated: HomeProduct[];
  brands: { slug: string; name: string; n: number }[];
}
interface CatalogLike {
  version: string;
  brands: { slug: string; name: string }[];
  categories: { slug: string; name: string; blurb?: string; audience?: string }[];
  products: ProductSummary[];
}

const ESSENTIALS: [string, string][] = [["bp-monitors", "BP monitors"], ["pulse-oximeters", "Pulse oximeters"], ["thermometers", "Thermometers"], ["nebulizers", "Nebulizers"], ["diabetes-care", "Diabetes care"], ["stethoscopes", "Stethoscopes"], ["weighing-scales", "Weighing scales"], ["orthopaedic-supports", "Orthopaedic supports"]];

const slim = (p: ProductSummary): HomeProduct => {
  const o: HomeProduct = { id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, mrp: p.mrp, category: p.category, brand: p.brand, featured: p.featured, inStock: p.inStock, priceOnRequest: p.priceOnRequest };
  if (p.from) o.from = true;
  if (p.rating) o.rating = p.rating;
  if (p.offer) o.offer = p.offer;
  return o;
};
const buyable = (p: ProductSummary) => p.inStock && !p.priceOnRequest && p.price != null && !!p.image;
const off = (p: ProductSummary) => (p.mrp && p.price != null && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);

export function homeData(d: CatalogLike): HomeData {
  const P = d.products;
  const essentials = ESSENTIALS.map(([slug, label]) => {
    const list = P.filter((p) => p.category === slug && buyable(p)).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    return list.length ? { slug, label, from: list[0]!.price!, image: (list.find((p) => p.featured) ?? list[Math.floor(list.length / 2)] ?? list[0])!.image } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4);
  const seen = new Map<string, number>();
  const latest = P.filter(buyable).sort((a, b) => b.id - a.id)
    .filter((p) => { const n = seen.get(p.category) ?? 0; seen.set(p.category, n + 1); return n < 2; }).slice(0, 16);
  const deals = P.filter((p) => buyable(p) && off(p) >= 5).sort((a, b) => off(b) - off(a) || b.id - a.id).slice(0, 16);
  const cats = d.categories.map((c) => {
    const list = P.filter((p) => p.category === c.slug && p.image);
    const pick = list.find((p) => p.featured && p.inStock) ?? list.find((p) => p.inStock) ?? list[0];
    const n = list.filter((p) => p.inStock).length;
    return pick && n ? { slug: c.slug, name: c.name, image: pick.image, n } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
  const rows = d.categories.filter((c) => c.audience !== "institution")
    .map((c) => ({ c, list: P.filter((p) => p.category === c.slug && buyable(p)) }))
    .filter((x) => x.list.length >= 6).sort((a, b) => b.list.length - a.list.length).slice(0, 3)
    .map(({ c, list }) => ({ slug: c.slug, name: c.name, blurb: c.blurb ?? "", list: [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0) || b.id - a.id).slice(0, 14).map(slim) }));
  const rated = P.filter((p) => buyable(p) && (p.rating?.count ?? 0) > 0).sort((a, b) => b.rating!.avg - a.rating!.avg || b.rating!.count - a.rating!.count).slice(0, 16);
  const brands = d.brands.map((b) => ({ slug: b.slug, name: b.name, n: P.filter((p) => p.brand === b.slug && p.inStock).length })).filter((b) => b.n > 0).sort((a, b) => b.n - a.n);
  return {
    version: d.version,
    stats: { inStock: P.filter((p) => p.inStock).length, brands: d.brands.length, categories: d.categories.length },
    essentials, latest: latest.map(slim), deals: deals.map(slim), cats, rows, rated: rated.map(slim), brands,
  };
}
