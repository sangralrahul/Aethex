/**
 * The cart (/cart): items with quantity, save for later and remove, the way to
 * free delivery, and the order summary with checkout. Totals follow lib/shop.ts.
 * Styles: src/shop.css (.ax-cart).
 */
import { Link, useLocation } from "wouter";
import { ArrowRight, Heart, Lock, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddToCart, useGetCart, useRemoveFromCart } from "@workspace/api-client-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderSummary, type Line } from "@/components/shop/OrderSummary";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { formatINR } from "@/lib/utils";
import { cartTotals, discountPct, FREE_DELIVERY_FROM } from "@/lib/shop";

const FALLBACK = "/product-images/medical-book.jpg";

export default function Cart() {
  useSeo({ title: "Your cart | Aethex Medical Store", description: "Review the items in your Aethex cart and check out.", path: "/cart" });
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wishlist = useWishlist();

  const { data: cart, isLoading } = useGetCart({ sessionId }, { query: { enabled: !!sessionId } });
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

  const lines = ((cart?.items ?? []) as unknown as Line[]);
  const t = cartTotals(lines);
  const busy = addToCart.isPending || removeFromCart.isPending;

  const change = (productId: number, delta: number) => {
    addToCart.mutate({ data: { productId, sessionId, quantity: delta } }, { onSuccess: refresh, onError: () => toast({ variant: "destructive", title: "Couldn't update the cart" }) });
  };
  const remove = (line: Line, msg = "Removed from your cart") => {
    removeFromCart.mutate({ itemId: line.id, params: { sessionId } }, { onSuccess: () => { refresh(); toast({ title: msg }); } });
  };
  const saveForLater = (line: Line) => {
    if (!wishlist.has(line.productId)) wishlist.toggle(line.productId);
    remove(line, "Moved to your wishlist");
  };

  if (isLoading || !sessionId) {
    return (
      <div className="ax-cart-page">
        <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]} title="Your cart" />
        <div className="ax-wrap ax-cart"><div className="ax-cart-main"><div className="sk" style={{ height: 140 }} /><div className="sk" style={{ height: 140, marginTop: 12 }} /></div><div className="sk" style={{ height: 300 }} /></div>
      </div>
    );
  }

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Cart" }]}
        title="Your cart"
        sub={t.count ? `${t.count} item${t.count === 1 ? "" : "s"}` : "Nothing here yet"}
      />

      {lines.length === 0 ? (
        <div className="ax-wrap">
          <div className="ax-empty ax-cart-empty">
            <span className="ic"><ShoppingBag size={26} /></span>
            <h2>Your cart is empty</h2>
            <p>Find stethoscopes, scrubs, books and equipment from brands you trust.</p>
            <div className="acts">
              <Link href="/shop" className="ax-btn teal">Browse the store</Link>
              {wishlist.ids.length > 0 && <Link href="/wishlist" className="ax-btn"><Heart size={16} /> Your wishlist ({wishlist.ids.length})</Link>}
            </div>
          </div>
        </div>
      ) : (
        <div className="ax-wrap ax-cart">
          <div className="ax-cart-main">
            <div className={`ax-freebar${t.delivery === 0 ? " done" : ""}`}>
              <Truck size={18} />
              <span>{t.delivery === 0 ? <>Your order gets <b>free delivery</b>.</> : <>Add <b>{formatINR(t.toFreeDelivery)}</b> more for free delivery.</>}</span>
              <i aria-hidden="true"><em style={{ width: `${Math.min(100, (t.subtotal / FREE_DELIVERY_FROM) * 100)}%` }} /></i>
            </div>

            <ul className="ax-lines">
              {lines.map((l) => {
                const off = discountPct(l.price, l.originalPrice);
                return (
                  <li key={l.id} className="ax-line" data-line={l.productId}>
                    <Link href={`/products/${l.productId}`} className="img"><img src={l.imageUrl || FALLBACK} alt="" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }} /></Link>
                    <div className="info">
                      {l.brand && <small>{l.brand}</small>}
                      <Link href={`/products/${l.productId}`} className="nm">{l.name}</Link>
                      <p className="unit">{formatINR(l.price)}{off > 0 && <><s>{formatINR(Number(l.originalPrice))}</s><em>{off}% off</em></>}</p>
                      <div className="acts">
                        <div className="ax-qty sm" role="group" aria-label={`Quantity of ${l.name}`}>
                          <button type="button" onClick={() => change(l.productId, -1)} disabled={busy || l.quantity <= 1} aria-label="One less"><Minus size={14} /></button>
                          <output>{l.quantity}</output>
                          <button type="button" onClick={() => change(l.productId, 1)} disabled={busy || l.quantity >= 10} aria-label="One more"><Plus size={14} /></button>
                        </div>
                        <button type="button" className="lnk" onClick={() => saveForLater(l)} disabled={busy}><Heart size={14} /> Save for later</button>
                        <button type="button" className="lnk danger" onClick={() => remove(l)} disabled={busy}><Trash2 size={14} /> Remove</button>
                      </div>
                    </div>
                    <b className="line-total">{formatINR(l.price * l.quantity)}</b>
                  </li>
                );
              })}
            </ul>
            <Link href="/shop" className="ax-link ax-keep">← Continue shopping</Link>
          </div>

          <aside className="ax-cart-side">
            <OrderSummary lines={lines}>
              <button type="button" className="ax-btn teal lg ax-sum-go" onClick={() => setLocation("/checkout")}>Checkout <ArrowRight size={18} /></button>
              <p className="ax-sum-secure"><Lock size={13} /> Secure checkout · UPI, cards, net banking, cash on delivery</p>
            </OrderSummary>
          </aside>
        </div>
      )}

      {lines.length > 0 && (
        <div className="ax-pdp-bar ax-cart-bar">
          <div><b>{formatINR(t.total)}</b><small>{t.count} item{t.count === 1 ? "" : "s"}{t.delivery === 0 ? " · free delivery" : ""}</small></div>
          <button type="button" className="ax-btn teal" onClick={() => setLocation("/checkout")}>Checkout <ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
