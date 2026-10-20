import { useEffect, useRef } from "react";
import { useCartLines, asProduct } from "@/lib/store/cart";
import { useStore } from "@/lib/store/api";
import { quoteLines } from "@/lib/store/rules";

/**
 * Saves the signed-in shopper's cart with their account on Cloudflare
 * (PUT /api/cart, worker/auth.ts), so the hourly job can email a reminder
 * when it is left for over an hour. Debounced; does nothing when signed out.
 */
export function useAbandonedCartTracker(signedIn: boolean) {
  const lines = useCartLines();
  const { data: store } = useStore(signedIn && lines.length > 0);
  const lastKeyRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    if (lines.length && !store) return; // wait for prices
    const q = quoteLines(lines, (id) => { const s = store?.byId.get(id); return s ? asProduct(s) : null; });
    const items = q.lines.map((l) => ({ productId: l.productId, name: l.variantLabel ? `${l.name} (${l.variantLabel})` : l.name, price: l.price, quantity: l.qty }));
    const key = JSON.stringify({ items, total: q.total });
    if (key === lastKeyRef.current) return;
    const first = lastKeyRef.current === "";
    lastKeyRef.current = key;
    if (first && items.length === 0) return; // nothing to tell the server on page load

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetch("/api/cart", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ items, total: q.total }) }).catch(() => { /* not critical */ });
    }, 2000);
  }, [signedIn, lines, store]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
}
