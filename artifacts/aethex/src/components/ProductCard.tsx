/**
 * A product in the store (shop, homepage rails, wishlist, related products):
 * the brand's photo, name, price or "price on request", and one action: add to
 * cart, choose a size or colour, or ask for the price.
 * Styles: src/site.css (.ax-prod) and src/shop.css.
 */
import { Link } from "wouter";
import { Heart, MessageSquareText, ShoppingCart } from "lucide-react";
import type { ProductSummary } from "@/lib/store/types";
import { discountPct } from "@/lib/store/rules";
import { cart } from "@/lib/store/cart";
import { formatINR } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/components/store/ProductImage";

interface ProductCardProps {
  product: ProductSummary;
  brandName?: string;
  viewMode?: "grid" | "list";
  eager?: boolean;
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : one.endsWith("s") ? "es" : "s"}`;
const optionWord = (name?: string) => {
  const n = (name || "option").toLowerCase();
  return n === "colour" ? "colour" : n === "size" ? "size" : n === "style" ? "style" : "option";
};

export function ProductCard({ product: p, brandName, viewMode = "grid", eager = false }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const saved = has(p.id);
  const off = p.priceOnRequest ? 0 : discountPct(p.price, p.mrp);
  const href = `/products/${p.slug}`;
  const variants = p.variants ?? [];
  const needsChoice = variants.length > 1;

  const fav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(p.id);
    toast({ title: added ? "Saved to your wishlist" : "Removed from your wishlist" });
  };
  const add = () => {
    const only = variants.length === 1 ? variants[0].id : null;
    const n = cart.add(p.id, only, 1);
    toast({ title: "Added to cart", description: n > 1 ? `You now have ${n} of these in your cart.` : p.name });
  };

  let action: React.ReactNode;
  if (p.priceOnRequest) {
    action = <Link href={`${href}#ask`} className="add wide" aria-label={`Ask for the price of ${p.name}`}><MessageSquareText size={15} /><span>Ask price</span></Link>;
  } else if (!p.inStock) {
    action = <span className="oos">Out of stock</span>;
  } else if (needsChoice) {
    action = <Link href={href} className="add wide" aria-label={`Choose a ${optionWord(p.optionName)} of ${p.name}`}><span>Choose</span></Link>;
  } else {
    action = <button type="button" className="add" onClick={add} aria-label={`Add ${p.name} to cart`}><ShoppingCart size={15} />{viewMode === "list" && <span>Add to cart</span>}</button>;
  }

  return (
    <article className={`ax-prod${viewMode === "list" ? " row" : ""}`} data-product={p.id}>
      <Link href={href} className="img" aria-label={p.name}>
        <ProductImage src={p.image} alt={p.name} width={viewMode === "list" ? 380 : 480} eager={eager} />
        {off >= 5 && <span className="off">{off}% off</span>}
      </Link>
      <button type="button" className={`fav${saved ? " on" : ""}`} onClick={fav} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}>
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="txt">
        <small>{brandName ?? p.brand}</small>
        <Link href={href} className="nm">{p.name}</Link>
        {needsChoice ? <span className="opt">{plural(variants.length, optionWord(p.optionName))}</span> : <span className="opt sub">{p.subcategory}</span>}
        {viewMode === "list" && p.summary && <p className="desc">{p.summary}</p>}
        <div className="row">
          {p.priceOnRequest ? (
            <span className="pr por">Price on request</span>
          ) : (
            <span className="pr">
              {p.from && <em>From </em>}{formatINR(Number(p.price))}
              {off >= 5 && <s>{formatINR(Number(p.mrp))}</s>}
            </span>
          )}
          {action}
        </div>
      </div>
    </article>
  );
}
