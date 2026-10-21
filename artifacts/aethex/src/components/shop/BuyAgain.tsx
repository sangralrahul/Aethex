/**
 * Buying again: a button that puts an order's items back in the cart (at
 * today's prices; anything no longer sold shows as unavailable in the cart),
 * and the "Buy it again" row on the shop, from the account's orders (or the
 * orders placed in this browser). Styles: src/buy.css (.ax-again*).
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RotateCcw, ShoppingCart } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { cart } from "@/lib/store/cart";
import { getOrder, myOrders, savedOrders, useStore, type CustomerOrder } from "@/lib/store/api";
import type { CartLine, ProductSummary } from "@/lib/store/types";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";

/** Puts these lines in the cart and opens it. */
export function BuyAgainButton({ lines, label = "Buy it all again", className = "ax-btn" }: { lines: CartLine[]; label?: string; className?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const go = () => {
    setBusy(true);
    const n = cart.addMany(lines.map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, qty: l.qty })));
    toast({ title: n ? `Added ${n} item${n === 1 ? "" : "s"} to your cart` : "These are in your cart already", description: "Prices are today's: check them in your cart." });
    setLocation("/cart");
  };
  return <button type="button" className={`${className} ax-again-btn`} onClick={go} disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : <RotateCcw size={16} />} {label}</button>;
}

/** The account's orders, else those placed in this browser (a few), newest first. */
function usePastOrders() {
  const { isLoggedIn } = useUserAuth();
  return useQuery({
    queryKey: ["store", "past-orders", isLoggedIn], staleTime: 5 * 60_000, retry: 0,
    queryFn: async (): Promise<CustomerOrder[]> => {
      if (isLoggedIn) { try { return (await myOrders()).orders; } catch { /* fall back to this browser's */ } }
      const local = savedOrders().slice(0, 6);
      if (!local.length) return [];
      const got = await Promise.allSettled(local.map((o) => getOrder(o.id, o.token)));
      return got.flatMap((g) => (g.status === "fulfilled" ? [g.value.order] : [])).sort((a, b) => b.createdAt - a.createdAt);
    },
  });
}

/** "Buy it again": what was ordered before (not cancelled), still on sale, most recent first. Nothing without past orders. */
export function BuyAgainRail() {
  const { data: orders } = usePastOrders();
  const { data: store } = useStore(!!orders?.length, { books: true });
  const items = useMemo(() => {
    if (!orders || !store) return [];
    const seen = new Set<number>();
    const out = [];
    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "pending") continue;
      for (const l of o.lines) {
        const p = store.byId.get(l.productId);
        if (!p || seen.has(p.id) || p.priceOnRequest) continue;
        seen.add(p.id);
        out.push(p);
      }
    }
    return out.slice(0, 10);
  }, [orders, store]);
  if (!items.length || !store) return null;
  return (
    <section className="ax-again" aria-label="Buy it again">
      <div className="ax-h-title"><h2><RotateCcw size={18} /> Buy it again</h2><p>From your earlier orders, at today&apos;s prices</p></div>
      <div className="ax-h-rail">
        {items.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
      </div>
    </section>
  );
}

/** Adds every item that needs no choosing (one size or colour), in stock and priced; says what was left out. */
export function AddAllButton({ items, label = "Add all to cart", className = "ax-btn teal" }: { items: ProductSummary[]; label?: string; className?: string }) {
  const { toast } = useToast();
  const ready = items.filter((p) => p.inStock && !p.priceOnRequest && (p.variants?.length ?? 0) <= 1);
  if (!ready.length) return null;
  const go = () => {
    const n = cart.addMany(ready.map((p) => ({ productId: p.id, variantId: p.variants?.length === 1 ? p.variants[0].id : null, qty: 1 })));
    const left = items.length - ready.length;
    toast({ title: `Added ${n} item${n === 1 ? "" : "s"} to your cart`, description: left ? `${left} need a size or colour chosen, or can't be bought right now.` : undefined });
  };
  const total = ready.reduce((s, p) => s + Number(p.price || 0), 0);
  return <button type="button" className={`${className} ax-addall`} onClick={go}><ShoppingCart size={16} /> {label}{ready.length > 1 ? ` (${ready.length}) · ${formatINR(total)}` : ""}</button>;
}
