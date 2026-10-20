/**
 * The bulk list on the hospital and medical college pages (/hospitals,
 * /medical-colleges), kept in this browser (localStorage) like the cart but with
 * institutional quantities (up to BULK_MAX_QTY of an item). It is sent as a
 * quotation request, or, when it is small enough, ordered straight away through
 * the cart (rules.directOrder).
 */
import { useMemo, useSyncExternalStore } from "react";
import type { BulkLine } from "./types";
import { BULK_MAX_LINES, BULK_MAX_QTY, cleanBulkLines, lineKey, priceBulk } from "./rules";
import { useStore } from "./api";
import { asProduct } from "./cart";

const KEY = "aethex:bulk:v1";
const EMPTY: BulkLine[] = [];
const listeners = new Set<() => void>();

function read(): BulkLine[] {
  if (typeof window === "undefined") return EMPTY;
  try { return cleanBulkLines(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return []; }
}

let lines: BulkLine[] = read();
const emit = () => listeners.forEach((f) => f());
function write(next: BulkLine[]) {
  lines = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: the list lasts for this visit */ }
  emit();
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => { if (e.key === KEY) { lines = read(); emit(); } });
}

const clampQty = (qty: number) => Math.max(1, Math.min(BULK_MAX_QTY, Math.trunc(qty) || 1));

export const bulk = {
  get: () => lines,
  /** Sets the quantity of a product (and option) in the list, adding it if it isn't there. Returns false when the list is full. */
  put(productId: number, variantId: string | null, qty: number): boolean {
    const k = lineKey(productId, variantId);
    const n = clampQty(qty);
    if (lines.some((l) => lineKey(l.productId, l.variantId) === k)) { write(lines.map((l) => (lineKey(l.productId, l.variantId) === k ? { ...l, qty: n } : l))); return true; }
    if (lines.length >= BULK_MAX_LINES) return false;
    write([...lines, { productId, variantId, qty: n }]);
    return true;
  },
  setQty(productId: number, variantId: string | null, qty: number) {
    const k = lineKey(productId, variantId);
    write(lines.map((l) => (lineKey(l.productId, l.variantId) === k ? { ...l, qty: clampQty(qty) } : l)));
  },
  remove(productId: number, variantId: string | null) {
    const k = lineKey(productId, variantId);
    write(lines.filter((l) => lineKey(l.productId, l.variantId) !== k));
  },
  clear() { write([]); },
};

const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export function useBulkLines(): BulkLine[] {
  return useSyncExternalStore(subscribe, () => lines, () => EMPTY);
}

/** The list at the store's prices (a guide), with the products it names. */
export function usePricedBulk() {
  const ls = useBulkLines();
  const { data: store, isLoading } = useStore(true);
  const priced = useMemo(() => priceBulk(ls, (id) => { const s = store?.byId.get(id); return s ? asProduct(s) : null; }), [ls, store]);
  return { lines: ls, priced, store, isLoading: isLoading && ls.length > 0 };
}
