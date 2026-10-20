/**
 * A product (/products/:id, /shop/:id): photo, price, quantity, add to cart and
 * buy now, wishlist and share, what's included in buying here, the description,
 * details, the rating and more from the same category.
 * Styles: src/shop.css (.ax-pdp).
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowLeft, BadgeCheck, Check, CreditCard, Heart, Minus, Package, Plus, RotateCcw, Share2, ShoppingCart, Star, Truck, Zap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAddToCart, useGetProduct, useListProducts, type Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { formatINR } from "@/lib/utils";
import { discountPct, FREE_DELIVERY_FROM, slugLabel } from "@/lib/shop";

const FALLBACK = "/product-images/medical-book.jpg";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="ax-stars" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} fill={s <= Math.round(value) ? "currentColor" : "none"} className={s <= Math.round(value) ? "on" : ""} />
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, shopParams] = useRoute("/shop/:id");
  const productId = parseInt(params?.id || shopParams?.id || "0", 10);
  const [, setLocation] = useLocation();
  const sessionId = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { has, toggle } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const { data: product, isLoading, error } = useGetProduct(productId);
  const { data: related } = useListProducts({ category: product?.categorySlug, limit: 9 }, { query: { enabled: !!product } });
  const addToCart = useAddToCart();

  useEffect(() => { setQuantity(1); window.scrollTo({ top: 0 }); }, [productId]);

  useSeo({
    title: product ? `${product.name} | Aethex Medical Store` : "Product | Aethex Medical Store",
    description: product ? `${product.name} by ${product.brand}. ${product.description}`.slice(0, 160) : "Genuine medical supplies on Aethex.",
    path: `/products/${productId}`,
    image: product?.imageUrl ? `https://aethex.in${product.imageUrl}` : undefined,
  });

  const add = (id: number, qty: number, then?: () => void) => {
    if (!sessionId) return;
    addToCart.mutate(
      { data: { productId: id, sessionId, quantity: qty } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/cart"] }); then ? then() : toast({ title: "Added to cart", description: qty > 1 ? `${qty} added.` : undefined }); },
        onError: () => toast({ variant: "destructive", title: "Couldn't add to cart", description: "Please try again." }),
      },
    );
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: product?.name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch { /* cancelled */ }
  };

  if (isLoading) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap ax-pdp ax-pdp-loading" aria-busy="true">
          <div className="sk ax-pdp-sk-img" /><div><div className="sk l1" /><div className="sk l2" /><div className="sk l3" /></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="ax-pdp-page">
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "48px 0" }}>
          <span className="ic"><Package size={26} /></span>
          <h2>This product isn't available</h2>
          <p>It may have been removed, or the link is incomplete.</p>
          <div className="acts"><Link href="/shop" className="ax-btn teal"><ArrowLeft size={16} /> Back to the store</Link></div>
        </div></div>
      </div>
    );
  }

  const price = Number(product.price);
  const mrp = Number(product.originalPrice ?? 0);
  const off = discountPct(price, mrp);
  const rating = Number(product.rating) || 0;
  const saved = has(product.id);
  const more: Product[] = ((related as { products?: Product[] } | undefined)?.products ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  const category = product.categorySlug;
  const details: [string, React.ReactNode][] = [
    ["Brand", <Link key="b" href={`/shop?brand=${encodeURIComponent(product.brand || "")}`}>{product.brand}</Link>],
    ["Category", category ? <Link key="c" href={`/category/${category}`}>{product.category || slugLabel(category)}</Link> : "—"],
    ["Item code", `AX-${String(product.id).padStart(5, "0")}`],
    ["Availability", product.inStock ? "In stock" : "Out of stock"],
  ];
  if (product.tags?.length) details.push(["Keywords", product.tags.join(", ")]);

  return (
    <div className="ax-pdp-page">
      <div className="ax-wrap">
        <nav className="ax-crumbs ax-pdp-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/shop">Shop</Link>
          {category && <><span aria-hidden="true">/</span><Link href={`/category/${category}`}>{product.category || slugLabel(category)}</Link></>}
          <span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
        </nav>
      </div>

      <div className="ax-wrap ax-pdp">
        {/* photo */}
        <div className="ax-pdp-gallery">
          <div
            className={`ax-pdp-img${zoom ? " zoom" : ""}`}
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
            onMouseLeave={() => setZoom(null)}
          >
            <img src={product.imageUrl || FALLBACK} alt={product.name} style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }} />
            {off > 0 && <span className="badge off">{off}% off</span>}
            {product.featured && <span className="badge pick">Bestseller</span>}
          </div>
          <div className="ax-pdp-tools">
            <button type="button" className={saved ? "on" : ""} onClick={() => { const a = toggle(product.id); toast({ title: a ? "Saved to your wishlist" : "Removed from your wishlist" }); }} aria-pressed={saved}>
              <Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save to wishlist"}
            </button>
            <button type="button" onClick={share}><Share2 size={16} /> Share</button>
          </div>
        </div>

        {/* buy box */}
        <div className="ax-pdp-info">
          <div className="ax-pdp-top">
            <Link href={`/shop?brand=${encodeURIComponent(product.brand || "")}`} className="brand">{product.brand}</Link>
            <span className={`stock${product.inStock ? "" : " out"}`}>{product.inStock ? <><Check size={14} /> In stock</> : "Out of stock"}</span>
          </div>
          <h1>{product.name}</h1>
          <a href="#rating" className="ax-pdp-rating"><Stars value={rating} /> <b>{rating.toFixed(1)}</b> <span>{Number(product.reviewCount || 0).toLocaleString("en-IN")} ratings</span></a>

          <div className="ax-pdp-price">
            <div className="now">
              <b>{formatINR(price)}</b>
              {off > 0 && <><s>{formatINR(mrp)}</s><em>{off}% off</em></>}
            </div>
            {off > 0 && <p className="save">You save {formatINR(mrp - price)}</p>}
            <p className="tax">Price includes GST</p>
          </div>

          {product.inStock ? (
            <div className="ax-pdp-buy">
              <div className="ax-qty" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="One less"><Minus size={16} /></button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" onClick={() => setQuantity((q) => Math.min(10, q + 1))} disabled={quantity >= 10} aria-label="One more"><Plus size={16} /></button>
              </div>
              <button type="button" className="ax-btn teal lg add" onClick={() => add(product.id, quantity)} disabled={addToCart.isPending}>
                <ShoppingCart size={18} /> {addToCart.isPending ? "Adding…" : "Add to cart"}
              </button>
              <button type="button" className="ax-btn dark lg" onClick={() => add(product.id, quantity, () => setLocation("/checkout"))} disabled={addToCart.isPending}>
                <Zap size={18} /> Buy now
              </button>
            </div>
          ) : (
            <div className="ax-pdp-oos">This product is out of stock right now. <Link href={category ? `/category/${category}` : "/shop"}>See similar products</Link></div>
          )}

          <ul className="ax-pdp-perks">
            <li><BadgeCheck size={20} /><span><b>Genuine product</b><small>From the brand or its authorised sellers</small></span></li>
            <li><Truck size={20} /><span><b>Delivery across India</b><small>Free delivery on orders from {formatINR(FREE_DELIVERY_FROM)}</small></span></li>
            <li><RotateCcw size={20} /><span><b>Easy returns</b><small>On eligible items</small></span></li>
            <li><CreditCard size={20} /><span><b>Secure checkout</b><small>UPI, cards, net banking or cash on delivery</small></span></li>
          </ul>
        </div>
      </div>

      {/* about + details + rating */}
      <section className="ax-wrap ax-pdp-more">
        <div className="ax-pdp-about">
          <h2>About this product</h2>
          <p>{product.description}</p>
          <h3>Details</h3>
          <dl className="ax-pdp-specs">
            {details.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
        <aside className="ax-pdp-score" id="rating">
          <h2>Customer rating</h2>
          <div className="big"><b>{rating.toFixed(1)}</b><span>out of 5</span></div>
          <Stars value={rating} size={20} />
          <p>Based on {Number(product.reviewCount || 0).toLocaleString("en-IN")} ratings from buyers.</p>
          <Link href={category ? `/category/${category}` : "/shop"} className="ax-link">More in {product.category || slugLabel(category)} →</Link>
        </aside>
      </section>

      {more.length > 0 && (
        <section className="ax-wrap ax-pdp-related">
          <div className="ax-h-title"><h2>More from {product.category || slugLabel(category)}</h2>{category && <Link href={`/category/${category}`} className="ax-link">See all →</Link>}</div>
          <div className="ax-grid grid">
            {more.map((p) => <ProductCard key={p.id} product={p} onAddToCart={(id) => add(id, 1)} isAdding={addToCart.isPending} />)}
          </div>
        </section>
      )}

      {/* phones: price and buttons stay in reach */}
      {product.inStock && (
        <div className="ax-pdp-bar">
          <div><b>{formatINR(price * quantity)}</b>{quantity > 1 && <small>{quantity} × {formatINR(price)}</small>}</div>
          <button type="button" className="ax-btn teal" onClick={() => add(product.id, quantity)} disabled={addToCart.isPending}><ShoppingCart size={17} /> Add</button>
          <button type="button" className="ax-btn dark" onClick={() => add(product.id, quantity, () => setLocation("/checkout"))} disabled={addToCart.isPending}>Buy now</button>
        </div>
      )}
    </div>
  );
}
