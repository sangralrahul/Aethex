import { useEffect, useRef } from "react";

interface CartItem {
  productId?: number | string;
  name?: string;
  price?: number;
  quantity?: number;
}

interface CartLike {
  items?: CartItem[];
  total?: number;
}

/**
 * Saves the signed-in shopper's cart with their account on Cloudflare
 * (PUT /api/cart, worker/auth.ts), so the hourly job can email a reminder
 * when it is left for over an hour. Debounced; a no-op when signed out.
 */
export function useAbandonedCartTracker(cart: CartLike | undefined | null) {
  const lastKeyRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const items = Array.isArray(cart?.items) ? cart!.items! : [];
    const total = Number(cart?.total || 0);
    const count = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const key = JSON.stringify({ count, total, ids: items.map((i) => i.productId) });
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        if (!localStorage.getItem("aethex_user")) return;
        const payload = count === 0 ? { items: [], total: 0 } : {
          items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
          total,
        };
        await fetch("/api/cart", { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      } catch {
        // silent - non-critical
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cart]);
}
