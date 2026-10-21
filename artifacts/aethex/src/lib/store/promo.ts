/**
 * Offers and coupons, set in the store admin (aethex.in/admin, "Offers"):
 *
 * - An offer is a sale on brands or categories for a time: their prices drop
 *   by its percent (to the whole rupee), MRP stays. The Worker applies it to the
 *   catalogue, the books and every quote, so the site, the cart and the order
 *   all use the same price.
 * - A coupon is a code typed at checkout: a percent (with an optional cap) or an
 *   amount off the items it covers, from a minimum order. Delivery is worked out
 *   on the total after the discount.
 *
 * Pure code shared by the site and the Worker (worker/store.ts).
 */
import type { Coupon, Offer, OfferTag, Product, PublicCoupon, Quote } from "./types";
import { DELIVERY_FEE, FREE_DELIVERY_FROM, round2 } from "./rules";

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ offers */

export const offerLive = (o: Pick<Offer, "active" | "startsAt" | "endsAt">, now: number) =>
  o.active && (!o.startsAt || o.startsAt <= now) && (!o.endsAt || now < o.endsAt);

const covers = (o: Pick<Offer, "categories" | "brands">, category: string, brand: string) =>
  o.categories.includes(category) || o.brands.includes(brand);

/** The best offer running now on a product (by its category and brand), if any. */
export function bestOffer(p: { category: string; brand: string }, offers: Offer[], now: number): Offer | null {
  let best: Offer | null = null;
  for (const o of offers) if (offerLive(o, now) && covers(o, p.category, p.brand) && (!best || o.percent > best.percent)) best = o;
  return best;
}

const cut = (price: number, percent: number) => Math.max(1, Math.round((price * (100 - percent)) / 100));

/** The product with the best running offer taken off its prices (and its variants'). Price on request stays so. */
export function applyOffers(p: Product, offers: Offer[], now: number): Product {
  if (!offers.length || p.priceOnRequest) return p;
  const o = bestOffer(p, offers, now);
  if (!o) return p;
  const q: Product = { ...p };
  if (q.price !== null) {
    q.mrp = Math.max(q.mrp ?? q.price, q.price);
    q.price = cut(q.price, o.percent);
  }
  if (p.variants?.length) {
    q.variants = p.variants.map((v) => (v.price === undefined ? v : { ...v, mrp: Math.max(v.mrp ?? v.price, v.price), price: cut(v.price, o.percent) }));
  }
  const tag: OfferTag = { title: o.title, percent: o.percent };
  if (o.endsAt) tag.endsAt = o.endsAt;
  q.offer = tag;
  return q;
}

/** Ids of the offers running now: part of the catalogue's version, so prices change when an offer starts or ends. */
export const liveOfferKey = (offers: Offer[], now: number) => offers.filter((o) => offerLive(o, now)).map((o) => o.id).sort().join(",");

/* ------------------------------------------------------------------ coupons */

/** A code as typed: capitals and digits, 3 to 20 characters ("" when it can't be one). */
export function cleanCouponCode(v: unknown): string {
  const c = String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length >= 3 && c.length <= 20 ? c : "";
}

export const couponLive = (c: Pick<Coupon, "active" | "startsAt" | "endsAt">, now: number) =>
  c.active && (!c.startsAt || c.startsAt <= now) && (!c.endsAt || now < c.endsAt);

export const publicCoupon = (c: Coupon): PublicCoupon => {
  const p: PublicCoupon = { code: c.code, kind: c.kind, value: c.value, minOrder: c.minOrder };
  if (c.maxDiscount) p.maxDiscount = c.maxDiscount;
  if (c.endsAt) p.endsAt = c.endsAt;
  if (c.categories?.length) p.categories = c.categories;
  if (c.brands?.length) p.brands = c.brands;
  if (c.label) p.label = c.label;
  return p;
};

/** "10% off, up to ₹200, on orders from ₹999" */
export function couponText(c: PublicCoupon): string {
  const what = c.kind === "percent" ? `${c.value}% off${c.maxDiscount ? `, up to ${rupees(c.maxDiscount)}` : ""}` : `${rupees(c.value)} off`;
  return `${what}${c.minOrder > 0 ? ` on orders from ${rupees(c.minOrder)}` : ""}`;
}

/**
 * A quote with the coupon's discount taken off, or why it can't be used.
 * `itemOf` gives each line's category and brand (to check what the code covers).
 */
export function applyCoupon(q: Quote, c: PublicCoupon, itemOf: (productId: number) => { category: string; brand: string } | undefined): Quote | { error: string } {
  const scoped = !!(c.categories?.length || c.brands?.length);
  const covered = q.lines.filter((l) => {
    if (!scoped) return true;
    const it = itemOf(l.productId);
    return !!it && ((c.categories ?? []).includes(it.category) || (c.brands ?? []).includes(it.brand));
  });
  const base = round2(covered.reduce((s, l) => s + l.lineTotal, 0));
  if (!covered.length || base <= 0) return { error: `Code ${c.code} doesn't apply to the items in your cart.` };
  if (base < c.minOrder) return { error: `Add ${rupees(c.minOrder - base)} more${scoped ? " of the items it covers" : ""} to use ${c.code} (${couponText(c)}).` };
  let discount = c.kind === "percent" ? (base * c.value) / 100 : c.value;
  if (c.kind === "percent" && c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(Math.round(discount), Math.floor(base));
  if (discount <= 0) return { error: `Code ${c.code} doesn't take anything off this order.` };
  const after = round2(q.subtotal - discount);
  const delivery = q.count === 0 || after >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return {
    ...q, discount, coupon: { code: c.code, label: c.label || couponText(c) },
    savings: round2(q.savings + discount), delivery, total: round2(after + delivery),
  };
}
