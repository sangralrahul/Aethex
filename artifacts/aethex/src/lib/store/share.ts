/**
 * Pay-for-me links: a cart (its lines, the coupon, who asks, a note, and if they
 * like, the address to deliver to) packed into the part of the link after "#",
 * which browsers never send to any server. Whoever opens it sees the items at
 * today's prices on the cart page, and pays. The address carried over is kept
 * for this visit only (sessionStorage) and fills in checkout.
 */
import type { Address, CartLine } from "./types";
import { MAX_LINES, MAX_QTY, normPhone, validPincode } from "./rules";

export type SharedCart = { lines: CartLine[]; from?: string; note?: string; coupon?: string; address?: Address };
const PREFIX = "pay=";
const PAYFOR_KEY = "aethex:payfor:v1";

const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** The link for a shared cart: short keys, so it stays a reasonable length for a chat message. */
export function shareLink(c: SharedCart, origin = window.location.origin): string {
  const a = c.address;
  const packed = {
    l: c.lines.map((x) => [x.productId, x.variantId ?? "", x.qty]),
    ...(c.from ? { f: c.from } : {}), ...(c.note ? { n: c.note } : {}), ...(c.coupon ? { c: c.coupon } : {}),
    ...(a ? { a: [a.name, a.phone, a.line1, a.line2 ?? "", a.landmark ?? "", a.city, a.state, a.pincode] } : {}),
  };
  return `${origin}/cart#${PREFIX}${toB64(JSON.stringify(packed))}`;
}

/** A shared cart from a link's "#pay=..." part, checked and cut to size; null when there isn't one (or it's broken). */
export function readShared(hash: string): SharedCart | null {
  const i = hash.indexOf(PREFIX);
  if (i < 0) return null;
  try {
    const v = JSON.parse(fromB64(hash.slice(i + PREFIX.length)));
    const lines: CartLine[] = (Array.isArray(v?.l) ? v.l : []).slice(0, MAX_LINES).map((x: unknown[]) => ({
      productId: Math.trunc(Number(x?.[0])), variantId: typeof x?.[1] === "string" && x[1] ? (x[1] as string).slice(0, 60) : null, qty: Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(x?.[2])) || 1)),
    })).filter((l: CartLine) => Number.isFinite(l.productId) && l.productId > 0);
    if (!lines.length) return null;
    const out: SharedCart = { lines };
    const from = txt(v.f, 60), note = txt(v.n, 200), code = txt(v.c, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (from) out.from = from;
    if (note) out.note = note;
    if (code) out.coupon = code;
    if (Array.isArray(v.a)) {
      const [name, phone, line1, line2, landmark, city, state, pincode] = v.a.map((x: unknown) => txt(x, 160));
      if (name && normPhone(phone) && line1 && city && state && validPincode(pincode)) {
        out.address = { name: name.slice(0, 80), phone: normPhone(phone), line1, city: city.slice(0, 60), state, pincode, ...(line2 ? { line2 } : {}), ...(landmark ? { landmark: landmark.slice(0, 100) } : {}) };
      }
    }
    return out;
  } catch {
    return null;
  }
}

/** The address a shared cart asked to deliver to, for checkout (this visit only). */
export function rememberPayFor(v: { from?: string; address: Address } | null) {
  try { if (v) sessionStorage.setItem(PAYFOR_KEY, JSON.stringify(v)); else sessionStorage.removeItem(PAYFOR_KEY); } catch { /* fine */ }
}
export function readPayFor(): { from?: string; address: Address } | null {
  try { const v = JSON.parse(sessionStorage.getItem(PAYFOR_KEY) || "null"); return v?.address ? v : null; } catch { return null; }
}

/** A WhatsApp link: to the store's number (with 91), or with no number to let the person pick a chat. */
export const whatsappLink = (text: string, number = "") => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
