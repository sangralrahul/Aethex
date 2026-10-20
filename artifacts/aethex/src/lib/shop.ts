/**
 * The store's money rules, in one place for the product page, the cart and
 * checkout. Prices include GST; delivery is free from FREE_DELIVERY_FROM.
 */
export const FREE_DELIVERY_FROM = 499;
export const DELIVERY_FEE = 40;

export type PricedLine = { price: number; originalPrice?: number | null; quantity: number };

export function discountPct(price: number, originalPrice?: number | null): number {
  const p = Number(price), o = Number(originalPrice ?? 0);
  return o > p ? Math.round(((o - p) / o) * 100) : 0;
}

export function cartTotals(lines: PricedLine[]) {
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);
  const mrp = lines.reduce((s, l) => s + Math.max(Number(l.price), Number(l.originalPrice ?? 0)) * l.quantity, 0);
  const savings = Math.max(0, mrp - subtotal);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const delivery = count === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { count, mrp, savings, subtotal, delivery, total: subtotal + delivery, toFreeDelivery: Math.max(0, FREE_DELIVERY_FROM - subtotal) };
}

/** "cardiac-care" → "Cardiac care" */
export function slugLabel(slug?: string | null): string {
  if (!slug) return "";
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
