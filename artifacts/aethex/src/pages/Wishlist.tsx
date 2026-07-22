import { Link } from "wouter";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useListProducts, useAddToCart, type Product } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { ids, clear } = useWishlist();
  const { data: raw } = useListProducts({});
  const { toast } = useToast();
  const addToCart = useAddToCart();

  const products: Product[] = Array.isArray(raw)
    ? (raw as Product[])
    : Array.isArray((raw as any)?.data)
      ? ((raw as any).data as Product[])
      : [];

  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div style={{ background: "#F5F3EE", minHeight: "100vh" }}>
      <PageHero
        icon={Heart}
        title="My Wishlist"
        subtitle={`${items.length} ${items.length === 1 ? "item" : "items"} saved`}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Heart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold mb-2" style={{ color: "#1C1C1E" }}>
              Your wishlist is empty
            </h3>
            <p className="text-slate-500 mb-6">Tap the heart on any product to save it here.</p>
            <Link href="/products">
              <Button style={{ background: "#007AFF" }} className="rounded-xl font-bold">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                Showing {items.length} of {ids.length} saved
              </p>
              <button
                onClick={() => {
                  clear();
                  toast({ title: "Wishlist cleared" });
                }}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(id) => {
                    addToCart.mutate(
                      { productId: id, quantity: 1 },
                      {
                        onSuccess: () => toast({ title: "Added to cart" }),
                        onError: () => toast({ title: "Failed to add", variant: "destructive" }),
                      },
                    );
                  }}
                  isAdding={addToCart.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
