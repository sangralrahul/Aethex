import { Link, useLocation } from "wouter";
import { PageHero } from "@/components/PageHero";
import {
  Trash2, Plus, Minus, ShoppingBag, Tag, Truck, ShieldCheck,
  MapPin, BadgeCheck, ChevronRight, Heart, RotateCcw, CreditCard,
} from "lucide-react";
import { useGetCart, useAddToCart, useRemoveFromCart } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { formatINR } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const FREE_DELIVERY_THRESHOLD = 499;
const PLATFORM_FEE = 3;

export default function Cart() {
  const sessionId = useSession();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<null | { code: string; amount: number }>(null);
  const [pincode, setPincode] = useState("");

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId } }
  );

  const addToCartMutation = useAddToCart();
  const removeFromCartMutation = useRemoveFromCart();

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    addToCartMutation.mutate(
      { data: { productId, sessionId, quantity: newQuantity } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) }
    );
  };

  const removeItem = (itemId: number) => {
    removeFromCartMutation.mutate(
      { itemId, params: { sessionId } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cart"] }) }
    );
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    // Simple demo: AETHEX10 = 10% off, SBI50 = ₹50 off
    if (!cart) return;
    if (code === "AETHEX10") setCouponApplied({ code, amount: Math.round(cart.total * 0.10) });
    else if (code === "SBI50") setCouponApplied({ code, amount: 50 });
    else setCouponApplied({ code, amount: 0 });
  };

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  const totals = useMemo(() => {
    if (!cart) return { mrp: 0, discount: 0, subtotal: 0, delivery: 0, fee: 0, coupon: 0, total: 0, saved: 0 };
    const mrp = cart.items.reduce((s, i) => s + (Number((i as any).originalPrice) || Number(i.price)) * i.quantity, 0);
    const subtotal = cart.total;
    const discount = Math.max(0, mrp - subtotal);
    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 40;
    const fee = PLATFORM_FEE;
    const c = couponApplied?.amount ?? 0;
    const total = Math.max(0, subtotal + delivery + fee - c);
    const saved = discount + (delivery === 0 ? 40 : 0) + c;
    return { mrp, discount, subtotal, delivery, fee, coupon: c, total, saved };
  }, [cart, couponApplied]);

  const freeDeliveryProgress = Math.min(100, Math.round((totals.subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totals.subtotal);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center" style={{ background: "#F5F3EE" }}>
        <div className="w-12 h-12 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 lg:pb-16" style={{ background: "#F5F3EE" }}>
      <PageHero
        tag="Shopping Cart"
        title={isEmpty ? "Your Cart" : `Cart (${cart!.itemCount} ${cart!.itemCount === 1 ? "item" : "items"})`}
        subtitle={isEmpty ? "Review your items and proceed to checkout" : `You'll save ${formatINR(totals.saved)} on this order`}
        icon={<ShoppingBag className="w-7 h-7" style={{ color: "rgba(255,255,255,0.82)" }} />}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb / step indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold mb-4" style={{ color: "#636366" }}>
          <span className="text-[#007AFF]">1. Cart</span>
          <ChevronRight className="w-3 h-3" />
          <span>2. Address</span>
          <ChevronRight className="w-3 h-3" />
          <span>3. Payment</span>
        </div>

        {isEmpty ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: "#F2F2F7" }}>
              <ShoppingBag className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#1C1C1E]">Your cart is empty</h2>
            <p className="text-slate-500 mb-8">Looks like you haven't added any medical supplies yet.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white" style={{ background: "#007AFF" }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* ── LEFT: items + deliver-to ── */}
            <div className="lg:col-span-8 space-y-3">
              {/* Deliver to */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center gap-3">
                <MapPin className="w-5 h-5 shrink-0" style={{ color: "#007AFF" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deliver to</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit pincode"
                      className="flex-1 min-w-0 bg-transparent outline-none text-sm font-semibold text-[#1C1C1E] placeholder:text-slate-400"
                    />
                    {pincode.length === 6 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Deliverable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Free-delivery progress */}
              {amountToFreeDelivery > 0 ? (
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Truck className="w-4 h-4" style={{ color: "#FF9500" }} />
                    <span className="text-[#1C1C1E]">
                      Add <b>{formatINR(amountToFreeDelivery)}</b> more for <span className="font-bold text-emerald-700">FREE Delivery</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${freeDeliveryProgress}%`, background: "linear-gradient(90deg,#00C2A8,#007AFF)" }} />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <Truck className="w-4 h-4" />
                  You've unlocked FREE Delivery on this order 🎉
                </div>
              )}

              {/* Items */}
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {cart!.items.map((item) => {
                  const original = Number((item as any).originalPrice) || Number(item.price);
                  const disc = original > item.price ? Math.round(((original - item.price) / original) * 100) : 0;
                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex gap-4">
                      <Link href={`/products/${item.productId}`} className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#F2F2F7]">
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584362917165-526a968579e8?w=400&q=80"; }}
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <Link href={`/products/${item.productId}`} className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#007AFF] text-[#1C1C1E]">
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">Seller: AETHEX Medical Pvt. Ltd.</p>

                        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                          <span className="font-bold text-lg text-[#1C1C1E]">{formatINR(item.price)}</span>
                          {original > item.price && (
                            <>
                              <span className="text-xs line-through text-slate-400">{formatINR(original)}</span>
                              <span className="text-xs font-bold text-emerald-700">{disc}% off</span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] mt-1.5 flex items-center gap-1 text-slate-500">
                          <Truck className="w-3 h-3 text-emerald-600" />
                          Delivery in 3–5 days · <span className="text-emerald-700 font-semibold">Free</span>
                        </p>

                        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                          <div className="flex items-center rounded-full border border-slate-300 overflow-hidden bg-white">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1 || addToCartMutation.isPending}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-[#1C1C1E]">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              disabled={addToCartMutation.isPending}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="text-xs font-bold text-slate-600 hover:text-[#007AFF] px-3 py-1.5 rounded-full hover:bg-slate-50 flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" /> SAVE FOR LATER
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={removeFromCartMutation.isPending}
                              className="text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust row */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5" style={{ color: "#007AFF" }} />
                  <p className="text-[11px] font-semibold text-[#1C1C1E]">100% Original</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-5 h-5" style={{ color: "#FF9500" }} />
                  <p className="text-[11px] font-semibold text-[#1C1C1E]">7-Day Returns</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <BadgeCheck className="w-5 h-5" style={{ color: "#00C2A8" }} />
                  <p className="text-[11px] font-semibold text-[#1C1C1E]">Verified Sellers</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: price details ── */}
            <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-[100px]">
              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF9500]" /> Apply Coupon
                </p>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter code (try AETHEX10)"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none border border-slate-200 focus:border-[#007AFF]"
                  />
                  <button onClick={applyCoupon} className="px-4 py-2 rounded-lg text-sm font-bold text-[#007AFF] bg-[#007AFF]/10 hover:bg-[#007AFF]/15">
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className={`text-xs mt-2 font-semibold ${couponApplied.amount > 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {couponApplied.amount > 0
                      ? `✓ ${couponApplied.code} applied — you saved ${formatINR(couponApplied.amount)}`
                      : `✗ Coupon "${couponApplied.code}" is not valid`}
                  </p>
                )}
              </div>

              {/* Price details */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100">
                  Price Details
                </h3>
                <div className="space-y-2.5 py-3 text-sm">
                  <Row label={`Price (${cart!.itemCount} ${cart!.itemCount === 1 ? "item" : "items"})`} value={formatINR(totals.mrp)} />
                  {totals.discount > 0 && <Row label="Discount" value={`− ${formatINR(totals.discount)}`} positive />}
                  {couponApplied && couponApplied.amount > 0 && <Row label={`Coupon (${couponApplied.code})`} value={`− ${formatINR(couponApplied.coupon ?? couponApplied.amount)}`} positive />}
                  <Row label="Delivery Charges" value={totals.delivery === 0 ? "FREE" : formatINR(totals.delivery)} positive={totals.delivery === 0} strike={totals.delivery === 0 ? "₹40" : undefined} />
                  <Row label="Platform Fee" value={formatINR(totals.fee)} />
                </div>
                <div className="border-t border-dashed border-slate-200 pt-3 flex items-center justify-between">
                  <span className="font-bold text-[#1C1C1E]">Total Amount</span>
                  <span className="font-extrabold text-xl text-[#1C1C1E]">{formatINR(totals.total)}</span>
                </div>
                {totals.saved > 0 && (
                  <div className="mt-3 py-2 px-3 rounded-lg text-xs font-bold text-emerald-800" style={{ background: "#D1FAE5" }}>
                    You will save {formatINR(totals.saved)} on this order
                  </div>
                )}

                <button
                  onClick={() => setLocation("/checkout")}
                  className="hidden lg:flex mt-4 w-full h-12 rounded-xl font-bold text-white items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  style={{ background: "linear-gradient(135deg,#FF9500,#FF6B00)" }}
                >
                  Place Order
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5" /> Safe and Secure Payments · 100% Authentic
                </div>
              </div>

              {/* Payment methods */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#007AFF]" /> Accepted Payments
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {["UPI", "Visa", "Master", "Rupay", "AmEx", "COD", "EMI", "Netbanking"].map((m) => (
                    <span key={m} className="px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky checkout footer */}
      {!isEmpty && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-extrabold text-[#1C1C1E] leading-none">{formatINR(totals.total)}</p>
            <button className="text-[11px] font-bold text-[#007AFF] mt-0.5">View price details</button>
          </div>
          <button
            onClick={() => setLocation("/checkout")}
            className="px-6 h-12 rounded-xl font-bold text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#FF9500,#FF6B00)" }}
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, positive, strike }: { label: string; value: string; positive?: boolean; strike?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${positive ? "text-emerald-700" : "text-[#1C1C1E]"}`}>
        {strike && <span className="line-through text-slate-400 mr-1.5">{strike}</span>}
        {value}
      </span>
    </div>
  );
}
