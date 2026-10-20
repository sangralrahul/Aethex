/**
 * The wishlist (/wishlist): products saved with the heart, newest first, with
 * add to cart. Saved in this browser (hooks/use-wishlist). Styles: src/shop.css.
 */
import { Link } from "wouter";
import { Heart, ShoppingBag } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddToCart, useListProducts, type Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { ShopHead } from "@/components/shop/ShopHead";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/use-seo";

export default function Wishlist() {
  useSeo({ title: "Your wishlist | Aethex Medical Store", description: "Products you saved on Aethex.", path: "/wishlist" });
  const { ids, clear } = useWishlist();
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const addToCart = useAddToCart();

  const { data, isLoading } = useListProducts({ ids: ids.join(",") } as never, { query: { enabled: ids.length > 0, placeholderData: (prev: unknown) => prev } as never });
  const found = ((data as { products?: Product[] } | undefined)?.products ?? []);
  const items = [...ids].reverse().map((id) => found.find((p) => p.id === id)).filter((p): p is Product => !!p);

  const add = (productId: number) => {
    if (!sessionId) return;
    addToCart.mutate(
      { data: { productId, sessionId, quantity: 1 } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); toast({ title: "Added to cart" }); },
        onError: () => toast({ variant: "destructive", title: "Couldn't add to cart", description: "Please try again." }),
      },
    );
  };

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Wishlist" }]}
        title="Your wishlist"
        sub={ids.length ? `${ids.length} saved item${ids.length === 1 ? "" : "s"} · kept on this device` : "Save products with the heart to find them here"}
        right={ids.length > 0 ? <button type="button" className="ax-btn" onClick={() => { clear(); toast({ title: "Wishlist cleared" }); }}>Clear wishlist</button> : undefined}
      />
      <div className="ax-wrap" style={{ paddingTop: 28 }}>
        {ids.length === 0 ? (
          <div className="ax-empty">
            <span className="ic"><Heart size={26} /></span>
            <h2>Nothing saved yet</h2>
            <p>Tap the heart on any product to keep it here for later.</p>
            <div className="acts"><Link href="/shop" className="ax-btn teal"><ShoppingBag size={16} /> Browse the store</Link></div>
          </div>
        ) : isLoading ? (
          <div className="ax-grid grid">{ids.slice(0, 4).map((id) => <div key={id} className="ax-prod sk" />)}</div>
        ) : (
          <div className="ax-grid grid">
            {items.map((p) => <ProductCard key={p.id} product={p} onAddToCart={add} isAdding={addToCart.isPending} />)}
          </div>
        )}
      </div>
    </div>
  );
}
