import { Link } from "wouter";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { type Product } from "@workspace/api-client-react";
import { formatINR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
  isAdding?: boolean;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, onAddToCart, isAdding, viewMode = "grid" }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const wishlisted = has(product.id);
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle(product.id);
    toast({ title: added ? "Added to wishlist" : "Removed from wishlist" });
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const ratingInt = Math.round(Number(product.rating) * 10) / 10;

  if (viewMode === "list") {
    return (
      <div className="group relative flex gap-4 rounded-2xl overflow-hidden transition-all duration-200 p-4"
        style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.1)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
      >
        {/* Image */}
        <Link href={`/products/${product.id}`} className="shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden block" style={{ background: "#F2F2F7" }}>
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"; }}
          />
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/products/${product.id}`}>
                <h3 className="font-semibold text-base leading-snug line-clamp-2 transition-colors hover:text-[#007AFF]" style={{ color: "#1C1C1E" }}>
                  {product.name}
                </h3>
              </Link>
              <p className="text-xs mt-0.5" style={{ color: "#8E8E93" }}>{product.brand}</p>
            </div>
            <button
              onClick={() => setWishlisted(v => !v)}
              className="shrink-0 p-1.5 rounded-full hover:bg-red-50 transition-colors"
            >
              <Heart className={cn("w-4 h-4 transition-colors", wishlisted ? "fill-red-500 text-red-500" : "text-slate-300")} />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white" style={{ background: ratingInt >= 4 ? "#388E3C" : ratingInt >= 3 ? "#F57C00" : "#C62828" }}>
              {ratingInt} <Star className="w-3 h-3 fill-white" />
            </span>
            <span className="text-xs" style={{ color: "#AEAEB2" }}>({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <span className="font-bold text-xl" style={{ color: "#1C1C1E" }}>{formatINR(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-sm line-through" style={{ color: "#AEAEB2" }}>{formatINR(product.originalPrice)}</span>
                {discount > 0 && (
                  <span className="text-xs font-bold text-emerald-600">{discount}% off</span>
                )}
              </>
            )}
          </div>

          {/* Stock + Add to Cart */}
          <div className="flex items-center gap-3 mt-auto pt-3">
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded", product.inStock ? "text-emerald-700" : "text-red-600")} style={{ background: product.inStock ? "rgba(52,142,60,0.08)" : "rgba(220,38,38,0.08)" }}>
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>
            <Button
              size="sm"
              onClick={() => onAddToCart?.(product.id)}
              disabled={!product.inStock || isAdding}
              className="rounded-xl font-bold text-xs h-8 px-4"
              style={{ background: "#007AFF" }}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              {isAdding ? "Adding…" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden transition-all duration-200 flex flex-col h-full"
      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Wishlist */}
      <button
        onClick={() => setWishlisted(v => !v)}
        className="absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
      >
        <Heart className={cn("w-4 h-4 transition-colors", wishlisted ? "fill-red-500 text-red-500" : "text-slate-400")} />
      </button>

      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-[#388E3C] text-white text-[11px] font-bold px-2 py-0.5 rounded">
            {discount}% off
          </span>
        </div>
      )}

      {/* Image */}
      <Link href={`/products/${product.id}`} className="block aspect-[4/3] overflow-hidden relative shrink-0" style={{ background: "#F2F2F7" }}>
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&q=80"; }}
        />
        {/* Hover: Add to Cart overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <button
            onClick={(e) => { e.preventDefault(); onAddToCart?.(product.id); }}
            disabled={!product.inStock || isAdding}
            className="w-full flex items-center justify-center gap-2 py-2.5 font-bold text-sm text-white disabled:opacity-60"
            style={{ background: "#007AFF" }}
          >
            <ShoppingCart className="w-4 h-4" />
            {isAdding ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name */}
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors mb-1 hover:text-[#007AFF]" style={{ color: "#1C1C1E" }}>
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] mb-2" style={{ color: "#8E8E93" }}>{product.brand}</p>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold text-white" style={{ background: ratingInt >= 4 ? "#388E3C" : ratingInt >= 3 ? "#F57C00" : "#C62828" }}>
            {ratingInt} <Star className="w-2.5 h-2.5 fill-white" />
          </span>
          <span className="text-[11px]" style={{ color: "#AEAEB2" }}>({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-lg leading-none" style={{ color: "#1C1C1E" }}>{formatINR(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs line-through" style={{ color: "#AEAEB2" }}>{formatINR(product.originalPrice)}</span>
            )}
          </div>
          <p className={cn("text-[10px] font-semibold mt-1", product.inStock ? "text-emerald-700" : "text-red-600")}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </p>
        </div>
      </div>
    </div>
  );
}
