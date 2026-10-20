/**
 * The cart, kept in this browser (localStorage) and shared by every page and
 * tab. Lines are product + variant + quantity; prices always come from the
 * catalogue, and the Worker prices the order again when it is placed.
 */
import { useMemo, useSyncExternalStore } from "react";
import type { CartLine, Product, ProductSummary, Variant } from "./types";
import { lineKey, MAX_LINES, MAX_QTY, quoteLines } from "./rules";
import { useStore } from "./api";
import { isBookId } from "./bookdata";

const KEY = "aethex:cart:v2";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

function clean(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const l of raw) {
    const productId = Math.trunc(Number(l?.productId));
    const qty = Math.trunc(Number(l?.qty));
    if (!Number.isFinite(productId) || productId <= 0 || !(qty > 0)) continue;
    out.push({ productId, variantId: typeof l?.variantId === "string" && l.variantId ? l.variantId : null, qty: Math.min(MAX_QTY, qty) });
  }
  return out.slice(0, MAX_LINES);
}
function read(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  try { return clean(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return []; }
}

let lines: CartLine[] = read();
const emit = () => listeners.forEach((f) => f());
function write(next: CartLine[]) {
  lines = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: the cart lasts for this visit */ }
  emit();
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) { lines = read(); emit(); } });
  // The old demo cart (sample products) is gone for good.
  try { Object.keys(localStorage).filter((k) => k.startsWith("aethex.cart.")).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}

export const cart = {
  get: () => lines,
  /** Adds to the line (or starts it); returns the new quantity, capped at MAX_QTY. */
  add(productId: number, variantId: string | null, qty = 1): number {
    const k = lineKey(productId, variantId);
    const cur = lines.find((l) => lineKey(l.productId, l.variantId) === k);
    const n = Math.min(MAX_QTY, (cur?.qty ?? 0) + Math.max(1, qty));
    write(cur ? lines.map((l) => (l === cur ? { ...l, qty: n } : l)) : [...lines, { productId, variantId, qty: n }].slice(-MAX_LINES));
    return n;
  },
  setQty(productId: number, variantId: string | null, qty: number) {
    const k = lineKey(productId, variantId);
    const n = Math.max(0, Math.min(MAX_QTY, Math.trunc(qty)));
    write(n ? lines.map((l) => (lineKey(l.productId, l.variantId) === k ? { ...l, qty: n } : l)) : lines.filter((l) => lineKey(l.productId, l.variantId) !== k));
  },
  remove(productId: number, variantId: string | null) {
    const k = lineKey(productId, variantId);
    write(lines.filter((l) => lineKey(l.productId, l.variantId) !== k));
  },
  clear() { write([]); },
};

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, () => lines, () => EMPTY);
}
export function useCartCount(): number {
  const ls = useCartLines();
  return ls.reduce((s, l) => s + l.qty, 0);
}

/** A list entry as the shared pricing rules expect a product. */
export function asProduct(s: ProductSummary): Product {
  return {
    id: s.id, slug: s.slug, brand: s.brand, name: s.name, category: s.category, subcategory: s.subcategory, featured: s.featured,
    price: s.price, mrp: s.mrp, priceOnRequest: s.priceOnRequest, inStock: s.inStock, images: s.image ? [s.image] : [],
    summary: s.summary, features: [], returns: "standard", optionName: s.optionName,
    variants: s.variants?.map((v) => ({ ...v }) as Variant),
  };
}

/** The cart priced from the catalogue, with what can't be bought right now listed separately. */
export function useCart() {
  const ls = useCartLines();
  const { data, isLoading, error } = useStore(true, { books: ls.some((l) => isBookId(l.productId)) });
  const quote = useMemo(() => quoteLines(ls, (id) => { const s = data?.byId.get(id); return s ? asProduct(s) : null; }), [ls, data]);
  return { lines: ls, quote, store: data, isLoading: isLoading && ls.length > 0, error };
}
