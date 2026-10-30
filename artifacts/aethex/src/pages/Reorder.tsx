/** Update 80: /reorder?p=ID&v=VARIANT&q=QTY, the one-click link in a reorder reminder: puts the item in the cart and opens it. */
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useToast } from "@/hooks/use-toast";
import { cart } from "@/lib/store/cart";
import { useStore } from "@/lib/store/api";

export default function Reorder() {
  useSeo({ title: "Reorder | Aethex Store", description: "Reorder.", path: "/reorder" });
  const [, go] = useLocation();
  const { toast } = useToast();
  const { data: store } = useStore(true, { books: true });
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!store) return;
    const q = new URLSearchParams(window.location.search);
    const id = Number(q.get("p")), v = q.get("v"), n = Math.max(1, Math.min(20, Number(q.get("q")) || 1));
    const p = store.byId.get(id);
    if (!p || p.priceOnRequest) { setErr("This product can't be ordered online right now."); return; }
    cart.add(p.id, v || (p.variants?.length === 1 ? p.variants[0]!.id : null), n);
    toast({ title: "Added to your cart", description: p.inStock ? "Check the price and place the order." : "It's out of stock right now: it will show in your cart." });
    go("/cart", { replace: true });
  }, [store]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="ax-wrap ax-orders-loading" style={{ padding: "60px 0" }}>{err ? <><p>{err}</p><Link href="/shop" className="ax-btn">Browse the store</Link></> : <><Loader2 size={20} className="spin" /> Adding it to your cart…</>}</div>;
}
