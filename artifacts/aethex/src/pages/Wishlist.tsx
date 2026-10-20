/**
 * The wishlist (/wishlist): products saved with the heart, newest first.
 * Saved in this browser (hooks/use-wishlist); products no longer sold drop out.
 * Styles: src/shop.css.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopHead } from "@/components/shop/ShopHead";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";
import { useStore } from "@/lib/store/api";
import { isBookId } from "@/lib/store/bookdata";
import type { ProductSummary } from "@/lib/store/types";

export default function Wishlist() {
  useSeo({ title: "Your wishlist | Aethex Store", description: "Products you saved on Aethex.", path: "/wishlist" });
  const { ids, clear, remove } = useWishlist();
  const { toast } = useToast();
  const { data: store, isLoading } = useStore(ids.length > 0, { books: ids.some(isBookId) });

  const items = store ? [...ids].reverse().map((id) => store.byId.get(id)).filter((p): p is ProductSummary => !!p) : [];
  // Saved items the store no longer sells (or the old sample products) are tidied away.
  useEffect(() => { if (store) ids.filter((id) => !store.byId.has(id)).forEach(remove); }, [store]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Wishlist" }]}
        title="Your wishlist"
        sub={items.length ? `${items.length} saved item${items.length === 1 ? "" : "s"} · kept on this device` : "Save products with the heart to find them here"}
        right={items.length > 0 ? <button type="button" className="ax-btn" onClick={() => { clear(); toast({ title: "Wishlist cleared" }); }}>Clear wishlist</button> : undefined}
      />
      <div className="ax-wrap" style={{ paddingTop: 28 }}>
        {ids.length === 0 || (store && items.length === 0) ? (
          <div className="ax-empty">
            <span className="ic"><Heart size={26} /></span>
            <h2>Nothing saved yet</h2>
            <p>Tap the heart on any product to keep it here for later.</p>
            <div className="acts"><Link href="/shop" className="ax-btn teal"><ShoppingBag size={16} /> Browse the store</Link></div>
          </div>
        ) : isLoading || !store ? (
          <div className="ax-grid grid">{ids.slice(0, 4).map((id) => <div key={id} className="ax-prod sk" />)}</div>
        ) : (
          <div className="ax-grid grid">
            {items.map((p) => <ProductCard key={p.id} product={p} brandName={store.brandName(p.brand)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
