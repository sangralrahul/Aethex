/**
 * The store's rules in one place, used by the site (prices shown, cart totals)
 * and by the Worker (the prices an order is actually placed at). Pure code: no
 * browser or Worker APIs, so both can import it.
 */
import type { CartLine, LineIssue, Override, PricedLine, Product, ProductSummary, Quote, Variant } from "./types";

/** Orders from this amount (after discounts) ship free; below it delivery costs DELIVERY_FEE. */
export const FREE_DELIVERY_FROM = 499;
export const DELIVERY_FEE = 40;
/** Most of one item a single order can hold, and most lines in a cart. */
export const MAX_QTY = 10;
export const MAX_LINES = 30;
/** Cash on delivery is offered up to this order total. */
export const COD_LIMIT = 50000;

export const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? round2(v) : null);

export const lineKey = (productId: number, variantId: string | null) => `${productId}:${variantId ?? ""}`;

/** The product with the store's own changes applied, or null when the store hides it. */
export function applyOverride(p: Product, o?: Override | null): Product | null {
  if (!o) return p;
  if (o.hidden) return null;
  const q: Product = { ...p };
  if (o.price !== undefined) {
    const price = num(o.price);
    q.price = price;
    q.priceOnRequest = price === null;
    if (price === null) q.mrp = null;
  }
  if (o.mrp !== undefined && q.price !== null) q.mrp = num(o.mrp);
  if (q.price !== null && (q.mrp === null || q.mrp < q.price)) q.mrp = q.price;
  if (typeof o.inStock === "boolean") q.inStock = o.inStock;
  if (o.countryOfOrigin) q.countryOfOrigin = o.countryOfOrigin;
  if (p.variants?.length && o.variants) {
    q.variants = p.variants.map((v) => {
      const vo = o.variants?.[v.id];
      if (!vo) return v;
      const w: Variant = { ...v };
      if (vo.price !== undefined) { const x = num(vo.price); if (x === null) delete w.price; else w.price = x; }
      if (vo.mrp !== undefined) { const x = num(vo.mrp); if (x === null) delete w.mrp; else w.mrp = x; }
      if (typeof vo.inStock === "boolean") w.inStock = vo.inStock;
      return w;
    });
  }
  // Every variant priced (and the product's price not set to "on request"): the product can be sold.
  if (q.price === null && o.price === undefined && q.variants?.length && q.variants.every((v) => v.price !== undefined)) {
    q.price = Math.min(...q.variants.map((v) => v.price as number));
    q.priceOnRequest = false;
  }
  return q;
}

export type Unit = { price: number; mrp: number; inStock: boolean; label?: string; image?: string };

/** What one unit costs: of the product, or of one of its variants. */
export function unitFor(p: Product, variantId: string | null): Unit | LineIssue["reason"] {
  const vs = p.variants ?? [];
  if (p.priceOnRequest) return "price-on-request";
  if (vs.length) {
    const v = variantId ? vs.find((x) => x.id === variantId) : vs.length === 1 ? vs[0] : undefined;
    if (!v) return variantId ? "unavailable" : "choose-option";
    const price = v.price ?? p.price;
    if (price === null || price === undefined) return "price-on-request";
    const mrp = Math.max(price, v.mrp ?? (v.price !== undefined ? v.price : p.mrp ?? price));
    if (!p.inStock || !v.inStock) return "out-of-stock";
    return { price, mrp, inStock: true, label: v.label, image: v.image };
  }
  if (variantId) return "unavailable";
  if (p.price === null) return "price-on-request";
  if (!p.inStock) return "out-of-stock";
  return { price: p.price, mrp: Math.max(p.price, p.mrp ?? p.price), inStock: true };
}

/** The product as lists show it: the cheapest variant that can be bought sets the price. */
export function summarize(p: Product): ProductSummary {
  const vs = p.variants ?? [];
  let price = p.price;
  let mrp = p.mrp;
  let from = false;
  if (vs.length && !p.priceOnRequest) {
    const priced = vs
      .map((v) => ({ v, price: v.price ?? p.price, mrp: v.mrp ?? v.price ?? p.mrp }))
      .filter((x): x is { v: Variant; price: number; mrp: number | null } => x.price !== null && x.price !== undefined);
    if (priced.length) {
      const inStock = priced.filter((x) => x.v.inStock);
      const pool = (inStock.length ? inStock : priced).sort((a, b) => a.price - b.price);
      price = pool[0].price;
      mrp = Math.max(pool[0].price, pool[0].mrp ?? pool[0].price);
      from = new Set(priced.map((x) => x.price)).size > 1;
    }
  }
  const s: ProductSummary = {
    id: p.id, slug: p.slug, brand: p.brand, name: p.name, category: p.category, subcategory: p.subcategory,
    featured: p.featured, price, mrp, priceOnRequest: p.priceOnRequest || price === null,
    inStock: p.inStock && (vs.length ? vs.some((v) => v.inStock) : true),
    image: p.images[0] ?? "", summary: p.summary.length > 180 ? `${p.summary.slice(0, 177).replace(/\s+\S*$/, "")}…` : p.summary,
  };
  if (from) s.from = true;
  if (p.images[1]) s.image2 = p.images[1];
  if (p.model) s.model = p.model;
  if (vs.length) {
    s.optionName = p.optionName ?? "Option";
    s.variants = vs.map((v) => {
      const out: NonNullable<ProductSummary["variants"]>[number] = { id: v.id, label: v.label, inStock: v.inStock };
      if (v.price !== undefined) out.price = v.price;
      if (v.mrp !== undefined) out.mrp = v.mrp;
      return out;
    });
  }
  return s;
}

/** Prices a cart against the catalogue. Lines that can't be bought come back as issues. */
export function quoteLines(raw: CartLine[], find: (id: number) => Product | null | undefined): Quote {
  const seen = new Map<string, CartLine>();
  for (const l of raw.slice(0, MAX_LINES * 2)) {
    const productId = Math.trunc(Number(l?.productId));
    if (!Number.isFinite(productId)) continue;
    const variantId = typeof l?.variantId === "string" && l.variantId ? l.variantId.slice(0, 80) : null;
    const qty = Math.max(1, Math.min(MAX_QTY, Math.trunc(Number(l?.qty)) || 1));
    const k = lineKey(productId, variantId);
    const prev = seen.get(k);
    seen.set(k, { productId, variantId, qty: Math.min(MAX_QTY, (prev?.qty ?? 0) + qty) });
  }
  const lines: PricedLine[] = [];
  const issues: LineIssue[] = [];
  for (const l of Array.from(seen.values()).slice(0, MAX_LINES)) {
    const p = find(l.productId);
    if (!p) { issues.push({ ...l, reason: "missing" }); continue; }
    const u = unitFor(p, l.variantId);
    if (typeof u === "string") { issues.push({ productId: l.productId, variantId: l.variantId, reason: u }); continue; }
    const line: PricedLine = {
      productId: p.id, variantId: l.variantId, qty: l.qty, slug: p.slug, name: p.name, brand: p.brand,
      image: u.image || p.images[0] || "", price: u.price, mrp: u.mrp, lineTotal: round2(u.price * l.qty),
    };
    if (u.label) line.variantLabel = u.label;
    lines.push(line);
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const mrpTotal = round2(lines.reduce((s, l) => s + l.mrp * l.qty, 0));
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const delivery = count === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { lines, issues, count, subtotal, mrpTotal, savings: round2(Math.max(0, mrpTotal - subtotal)), delivery, total: round2(subtotal + delivery) };
}

export function discountPct(price: number | null | undefined, mrp: number | null | undefined): number {
  const p = Number(price ?? 0), o = Number(mrp ?? 0);
  return p > 0 && o > p ? Math.round(((o - p) / o) * 100) : 0;
}

/* ------------------------------------------------------------------ contact details */

/** An Indian mobile number as 10 digits, or "" when it isn't one. */
export function normPhone(v: unknown): string {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}

export const validPincode = (v: unknown) => /^[1-9]\d{5}$/.test(String(v ?? "").trim());
export const validEmail = (v: unknown) => { const e = String(v ?? "").trim(); return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e); };

export const INDIAN_STATES = [
  "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export const ORDER_STATUSES = ["placed", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const STATUS_LABEL: Record<(typeof ORDER_STATUSES)[number], string> = {
  placed: "Order placed", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};
/** A customer may cancel until the order ships. */
export const cancellable = (status: string) => status === "placed" || status === "confirmed";

/**
 * "Recommended" order: better tiers first (in stock, popular, priced), and within
 * a tier the brands take turns, so one brand's long range doesn't fill the page.
 */
export function mixBrands<T extends { brand: string }>(list: T[], tier: (p: T) => number): T[] {
  const tiers = new Map<number, T[]>();
  for (const p of list) { const t = tier(p); (tiers.get(t) ?? tiers.set(t, []).get(t)!).push(p); }
  const out: T[] = [];
  for (const t of Array.from(tiers.keys()).sort((a, b) => b - a)) {
    const byBrand = new Map<string, T[]>();
    for (const p of tiers.get(t)!) (byBrand.get(p.brand) ?? byBrand.set(p.brand, []).get(p.brand)!).push(p);
    const queues = Array.from(byBrand.values());
    for (let i = 0; queues.some((q) => i < q.length); i++) for (const q of queues) if (i < q.length) out.push(q[i]);
  }
  return out;
}
