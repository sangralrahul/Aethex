/**
 * A product in the store (shop, wishlist, related products), in the site style:
 * the same card as the homepage. Styles: src/site.css (.ax-prod) and src/shop.css.
 */
import { Link } from "wouter";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { type Product } from "@workspace/api-client-react";
import { formatINR } from "@/lib/utils";
import { discountPct } from "@/lib/shop";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  isAdding?: boolean;
  viewMode?: "grid" | "list";
}

const FALLBACK = "/product-images/medical-book.jpg";

export function ProductCard({ product, onAddToCart, isAdding, viewMode = "grid" }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const saved = has(product.id);
  const off = discountPct(product.price, product.originalPrice);
  const rating = Number(product.rating) || 0;
  const href = `/products/${product.id}`;

  const fav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(product.id);
    toast({ title: added ? "Saved to your wishlist" : "Removed from your wishlist" });
  };

  return (
    <article className={`ax-prod${viewMode === "list" ? " row" : ""}`} data-product={product.id}>
      <Link href={href} className="img" aria-label={product.name}>
        <img src={product.imageUrl || FALLBACK} alt={product.name} loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }} />
        {off > 0 && <span className="off">{off}% off</span>}
      </Link>
      <button type="button" className={`fav${saved ? " on" : ""}`} onClick={fav} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="txt">
        <small>{product.brand}</small>
        <Link href={href} className="nm">{product.name}</Link>
        <span className="rt"><Star size={13} fill="currentColor" /> {rating.toFixed(1)} <em>({Number(product.reviewCount || 0).toLocaleString("en-IN")})</em></span>
        {viewMode === "list" && product.description && <p className="desc">{product.description}</p>}
        <div className="row">
          <span className="pr">
            {formatINR(Number(product.price))}
            {off > 0 && <s>{formatINR(Number(product.originalPrice))}</s>}
          </span>
          {product.inStock ? (
            <button type="button" className="add" onClick={() => onAddToCart?.(product.id)} disabled={isAdding} aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart size={15} />{viewMode === "list" && <span>Add to cart</span>}
            </button>
          ) : (
            <span className="oos">Out of stock</span>
          )}
        </div>
      </div>
    </article>
  );
}
