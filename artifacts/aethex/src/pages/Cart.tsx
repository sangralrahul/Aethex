/**
 * The cart (/cart): items with their size or colour and quantity, save for
 * later and remove, items that can't be bought right now, the way to free
 * delivery, a coupon code, and the order summary with checkout. Totals follow
 * lib/store/rules (and the Worker's quote when a coupon is on, lib/store/coupon).
 * Also the other ways to buy (ask someone to pay, WhatsApp, call me to order),
 * and a pay-for-me link opened here (components/shop/MoreWays).
 * Styles: src/buy.css (.ax-cart).
 */
import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, ArrowRight, Banknote, Heart, Lock, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { ShopHead } from "@/components/shop/ShopHead";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { CouponBox } from "@/components/shop/CouponBox";
import { BuySteps, PayWays, TrustList } from "@/components/shop/BuyKit";
import { MoreWays, SharedCartBanner } from "@/components/shop/MoreWays";
import { ProductImage } from "@/components/store/ProductImage";
import { isBookId, itemHref } from "@/lib/store/bookdata";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/use-wishlist";
import { useSeo } from "@/hooks/use-seo";
import { cart } from "@/lib/store/cart";
import { usePricedCart } from "@/lib/store/coupon";
import { useStoreConfig } from "@/lib/store/api";
import { discountPct, FREE_DELIVERY_FROM, MAX_QTY } from "@/lib/store/rules";
import type { LineIssue } from "@/lib/store/types";
import { formatINR } from "@/lib/utils";

const ISSUE_TEXT: Record<LineIssue["reason"], string> = {
  missing: "This product is no longer sold.",
  unavailable: "This option is no longer available.",
  "price-on-request": "This product is now price on request.",
  "out-of-stock": "Out of stock right now.",
  "choose-option": "Choose a size or colour on the product page.",
};

export default function Cart() {
  useSeo({ title: "Your cart | Aethex Store", description: "Review the items in your cart and check out.", path: "/cart" });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wishlist = useWishlist();
  const priced = usePricedCart();
  const { lines, quote: t, store, isLoading } = priced;
  const { data: config } = useStoreConfig();
  const toFree = Math.max(0, FREE_DELIVERY_FROM - (t.subtotal - (t.discount ?? 0)));

  const saveForLater = (productId: number, variantId: string | null) => {
    if (!wishlist.has(productId)) wishlist.toggle(productId);
    cart.remove(productId, variantId);
    toast({ title: "Moved to your wishlist" });
  };
  const remove = (productId: number, variantId: string | null) => { cart.remove(productId, variantId); toast({ title: "Removed from your cart" }); };

  if (isLoading) {
    return (
      <div className="ax-cart-page">
        <ShopHead compact crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]} title="Your cart" />
        <div className="ax-wrap"><SharedCartBanner /></div>
        <div className="ax-wrap ax-cart"><div className="ax-cart-main"><div className="sk" style={{ height: 140 }} /><div className="sk" style={{ height: 140, marginTop: 12 }} /></div><div className="sk" style={{ height: 300 }} /></div>
      </div>
    );
  }

  const issueLines = t.issues.map((i) => ({ ...i, p: store?.byId.get(i.productId) }));

  return (
    <div className="ax-cart-page">
      <ShopHead
        compact
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: "Cart" }]}
        title="Your cart"
        sub={t.count ? `${t.count} item${t.count === 1 ? "" : "s"}` : lines.length ? "Nothing in your cart can be bought right now" : "Nothing here yet"}
        right={lines.length > 0 ? <BuySteps at={0} className="ax-cart-steps" /> : undefined}
      />

      <div className="ax-wrap"><SharedCartBanner /></div>
      {lines.length === 0 ? (
        <div className="ax-wrap">
          <div className="ax-empty ax-cart-empty">
            <span className="ic"><ShoppingBag size={26} /></span>
            <h2>Your cart is empty</h2>
            <p>BP monitors, stethoscopes, glucometers, supports and more, from brands you trust.</p>
            <div className="acts">
              <Link href="/shop" className="ax-btn teal">Browse the store</Link>
              {wishlist.ids.length > 0 && <Link href="/wishlist" className="ax-btn"><Heart size={16} /> Your wishlist ({wishlist.ids.length})</Link>}
            </div>
          </div>
        </div>
      ) : (
        <div className="ax-wrap ax-cart">
          <div className="ax-cart-main">
            {t.count > 0 && (
              <div className={`ax-freebar${t.delivery === 0 ? " done" : ""}`}>
                <span className="ic"><Truck size={19} /></span>
                <span>{t.delivery === 0 ? <>Your order gets <b>free delivery</b>.</> : <>Add <b>{formatINR(toFree)}</b> more for free delivery.</>}</span>
                <i aria-hidden="true"><em style={{ width: `${Math.min(100, ((FREE_DELIVERY_FROM - toFree) / FREE_DELIVERY_FROM) * 100)}%` }} /></i>
              </div>
            )}

            <ul className="ax-lines">
              {t.lines.map((l, i) => {
                const off = discountPct(l.price, l.mrp);
                const href = itemHref(l.productId, l.slug);
                return (
                  <li key={`${l.productId}:${l.variantId ?? ""}`} className="ax-line" data-line={l.productId} style={{ ["--d" as string]: `${Math.min(i, 6) * 60}ms` }}>
                    <Link href={href} className="img"><ProductImage src={l.image} width={240} book={isBookId(l.productId)} /></Link>
                    <div className="info">
                      <small>{store?.brandName(l.brand) ?? l.brand}</small>
                      <Link href={href} className="nm">{l.name}</Link>
                      {l.variantLabel && <p className="var">{store?.byId.get(l.productId)?.optionName ?? "Option"}: {l.variantLabel}</p>}
                      <p className="unit">{formatINR(l.price)}{off > 0 && <><s>{formatINR(l.mrp)}</s><em>{off}% off</em></>}</p>
                      <div className="acts">
                        <div className="ax-qty sm" role="group" aria-label={`Quantity of ${l.name}`}>
                          <button type="button" onClick={() => cart.setQty(l.productId, l.variantId, l.qty - 1)} disabled={l.qty <= 1} aria-label="One less"><Minus size={14} /></button>
                          <output>{l.qty}</output>
                          <button type="button" onClick={() => cart.setQty(l.productId, l.variantId, l.qty + 1)} disabled={l.qty >= MAX_QTY} aria-label="One more"><Plus size={14} /></button>
                        </div>
                        <button type="button" className="lnk" onClick={() => saveForLater(l.productId, l.variantId)}><Heart size={14} /> Save for later</button>
                        <button type="button" className="lnk danger" onClick={() => remove(l.productId, l.variantId)}><Trash2 size={14} /> Remove</button>
                      </div>
                    </div>
                    <b className="line-total">{formatINR(l.lineTotal)}</b>
                  </li>
                );
              })}
            </ul>

            {issueLines.length > 0 && (
              <div className="ax-cart-issues">
                <h2><AlertTriangle size={17} /> Can't be ordered right now</h2>
                <ul>
                  {issueLines.map((i) => (
                    <li key={`${i.productId}:${i.variantId ?? ""}`}>
                      {i.p ? <Link href={itemHref(i.p.id, i.p.slug)} className="img"><ProductImage src={i.p.image} width={160} book={isBookId(i.p.id)} /></Link> : <span className="img" />}
                      <span className="tx">
                        <b>{i.p?.name ?? "A product that's no longer sold"}</b>
                        <small>{ISSUE_TEXT[i.reason]}</small>
                      </span>
                      <span className="acts">
                        {i.p && i.reason === "choose-option" && <Link href={itemHref(i.p.id, i.p.slug)} className="lnk">Choose</Link>}
                        {i.p && i.reason === "price-on-request" && <Link href={`${itemHref(i.p.id, i.p.slug)}#ask`} className="lnk">Ask price</Link>}
                        <button type="button" className="lnk danger" onClick={() => cart.remove(i.productId, i.variantId)}><Trash2 size={14} /> Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/shop" className="ax-link ax-keep"><ArrowLeft size={16} /> Continue shopping</Link>
          </div>

          <aside className="ax-cart-side">
            <OrderSummary quote={t} payLabel={config?.onlinePayments ? "Total" : "To pay on delivery"} coupon={t.count > 0 ? <CouponBox priced={priced} /> : undefined}>
              <button type="button" className="ax-btn teal lg ax-sum-go ax-shine" onClick={() => setLocation("/checkout")} disabled={t.count === 0}><Lock size={16} /> Checkout securely <ArrowRight size={18} /></button>
              <div className="ax-cart-pay">
                <p className="ax-sum-secure"><Banknote size={14} /> {config?.onlinePayments ? "Pay online or cash on delivery" : "Cash on delivery · pay when it arrives"}{config?.bankTransfer ? ", or by bank transfer" : ""}</p>
                {config?.onlinePayments && <PayWays />}
              </div>
            </OrderSummary>
            {t.count > 0 && <MoreWays lines={lines} priced={t.lines} total={t.total} code={priced.applied ? priced.code : undefined} />}
            {t.count > 0 && <TrustList online={!!config?.onlinePayments} />}
          </aside>
        </div>
      )}

      {t.count > 0 && (
        <div className="ax-pdp-bar ax-cart-bar">
          <div><b>{formatINR(t.total)}</b><small>{t.count} item{t.count === 1 ? "" : "s"}{t.delivery === 0 ? " · free delivery" : ""}</small></div>
          <button type="button" className="ax-btn teal" onClick={() => setLocation("/checkout")}>Checkout <ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
