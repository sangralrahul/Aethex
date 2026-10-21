/**
 * A coupon code on the cart: kept in this browser (localStorage) like the cart,
 * and checked by the Worker every time the cart is priced (POST /api/store/quote
 * with the code), so the discount shown is always the one the order will get.
 * The codes themselves are set in the store admin (lib/store/promo.ts).
 */
import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuote } from "./api";
import { cleanCouponCode } from "./promo";
import { useCart } from "./cart";
import type { CartLine, Quote } from "./types";

const KEY = "aethex:coupon:v1";
const listeners = new Set<() => void>();
const read = () => { try { return cleanCouponCode(localStorage.getItem(KEY) || ""); } catch { return ""; } };
let code = typeof window === "undefined" ? "" : read();
const emit = () => listeners.forEach((f) => f());
if (typeof window !== "undefined") window.addEventListener("storage", (e) => { if (e.key === KEY) { code = read(); emit(); } });

export const coupon = {
  get: () => code,
  set(c: string) { code = cleanCouponCode(c); try { if (code) localStorage.setItem(KEY, code); else localStorage.removeItem(KEY); } catch { /* storage blocked */ } emit(); },
  clear() { coupon.set(""); },
};
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const useCouponCode = () => useSyncExternalStore(subscribe, () => code, () => "");

/** The cache key of the Worker's quote for these lines and code (shared with the coupon box). */
export const quoteKey = (lines: CartLine[], code: string, phone?: string) =>
  ["store", "quote", lines.map((l) => `${l.productId}:${l.variantId ?? ""}:${l.qty}`).join("|"), code, phone ?? ""];

/**
 * The cart priced as the order will be: the catalogue's prices, and, with a
 * coupon, the Worker's own quote with the discount (and the delivery charge
 * worked out after it). `phone` lets the Worker check a code that can be used
 * only so many times per mobile number.
 */
export function usePricedCart(phone?: string) {
  const c = useCart();
  const code = useCouponCode();
  const q = useQuery({
    queryKey: quoteKey(c.lines, code, phone),
    queryFn: () => getQuote(c.lines, { coupon: code, phone }),
    enabled: !!code && c.quote.count > 0,
    staleTime: 60_000,
    retry: 0,
  });
  const s = q.data;
  const applied = !!(code && s && !s.couponError && s.discount && s.count === c.quote.count);
  const quote: Quote = applied
    ? { ...c.quote, subtotal: s!.subtotal, mrpTotal: s!.mrpTotal, savings: s!.savings, delivery: s!.delivery, total: s!.total, discount: s!.discount, coupon: s!.coupon }
    : c.quote;
  return {
    ...c, quote, code, applied,
    couponError: code && c.quote.count > 0 ? (s?.couponError ?? (q.error ? (q.error as Error).message : "")) : "",
    checking: !!code && c.quote.count > 0 && q.isFetching,
  };
}
