import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
 * Syncs the signed-in user's current cart to `abandoned_carts` so the
 * `send-abandoned-cart` edge function can email a reminder after 1h.
 * Debounces upserts to avoid spamming the DB on every quantity change.
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id || !user.email) return;

        if (count === 0) {
          await supabase.from("abandoned_carts").delete().eq("user_id", user.id);
          return;
        }

        await supabase.from("abandoned_carts").upsert({
          user_id: user.id,
          email: user.email,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          item_count: count,
          total,
          updated_at: new Date().toISOString(),
          notified_at: null,
        }, { onConflict: "user_id" });
      } catch {
        // silent - non-critical
      }
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cart]);
}
