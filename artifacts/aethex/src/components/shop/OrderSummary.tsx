/**
 * The order summary box (cart and checkout), from a priced quote (lib/store/rules,
 * with a coupon from lib/store/coupon): the items (at checkout), the coupon, the
 * price details with amounts that roll in when they change, and the savings.
 * `payLabel` names the total: "To pay on delivery" for cash on delivery, "To pay
 * now" online. Styles: src/buy.css (.ax-sum).
 */
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { PricedLine, Quote } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { isBookId } from "@/lib/store/bookdata";
import { ProductImage } from "@/components/store/ProductImage";
import { Roll } from "./BuyKit";

type SummaryQuote = Pick<Quote, "count" | "subtotal" | "mrpTotal" | "savings" | "delivery" | "total" | "discount" | "coupon">;

export function OrderSummary({ quote: t, children, coupon: couponSlot, items, brandName, title = "Order summary", payLabel = "To pay on delivery", credit = 0 }: {
  quote: SummaryQuote; children?: ReactNode; coupon?: ReactNode; items?: PricedLine[]; brandName?: (slug: string) => string; title?: string; payLabel?: string; credit?: number;
}) {
  const coupon = t.discount && t.discount > 0 ? t.discount : 0;
  const mrpOff = Math.max(0, Math.round((t.savings - coupon) * 100) / 100);
  return (
    <div className="ax-sum">
      <div className="ax-sum-hd">
        <h2>{title}</h2>
        {t.count > 0 && <span className="n">{t.count} item{t.count === 1 ? "" : "s"}</span>}
      </div>
      {items && items.length > 0 && (
        <ul className="ax-sum-list">
          {items.map((l) => (
            <li key={`${l.productId}:${l.variantId ?? ""}`}>
              <span className="pic"><ProductImage src={l.image} width={120} book={isBookId(l.productId)} /><em>{l.qty}</em></span>
              <span className="tx"><b>{l.name}</b><small>{l.variantLabel ? `${l.variantLabel} · ` : ""}{brandName?.(l.brand) ?? l.brand}</small></span>
              <span className="pr">{formatINR(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
      )}
      {couponSlot && <div className="ax-sum-coupon">{couponSlot}</div>}
      <dl>
        <div><dt>Items ({t.count}) at MRP</dt><dd>{formatINR(t.mrpTotal)}</dd></div>
        {mrpOff > 0 && <div className="good"><dt>Discount</dt><dd>− {formatINR(mrpOff)}</dd></div>}
        {coupon > 0 && <div className="good"><dt>Coupon{t.coupon ? <> <code>{t.coupon.code}</code></> : null}</dt><dd>− {formatINR(coupon)}</dd></div>}
        <div className={t.delivery === 0 ? "good" : ""}><dt>Delivery</dt><dd>{t.count === 0 ? "—" : t.delivery === 0 ? "Free" : formatINR(t.delivery)}</dd></div>
        {credit > 0 && <div className="good" data-store="credit-row"><dt>Store credit</dt><dd>− {formatINR(credit)}</dd></div>}
        <div className="total"><dt>{payLabel}</dt><dd><Roll value={t.total} /></dd></div>
      </dl>
      <p className="ax-sum-note">Prices are inclusive of all taxes.{BUSINESS.gstin ? " A GST invoice comes with your order." : ""}</p>
      {t.savings > 0 && <p className="ax-sum-save"><Sparkles size={15} /> <span>You save <Roll value={t.savings} /> on this order</span></p>}
      {children}
    </div>
  );
}
