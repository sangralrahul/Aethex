/**
 * The order summary box (cart and checkout), from a priced quote (lib/store/rules,
 * with a coupon from lib/store/coupon). `payLabel` names the total: "To pay on
 * delivery" for cash on delivery, "To pay now" online. Styles: src/shop.css (.ax-sum).
 */
import type { ReactNode } from "react";
import { formatINR } from "@/lib/utils";
import type { Quote } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";

type SummaryQuote = Pick<Quote, "count" | "subtotal" | "mrpTotal" | "savings" | "delivery" | "total" | "discount" | "coupon">;

export function OrderSummary({ quote: t, children, title = "Order summary", payLabel = "To pay on delivery" }: { quote: SummaryQuote; children?: ReactNode; title?: string; payLabel?: string }) {
  const coupon = t.discount && t.discount > 0 ? t.discount : 0;
  const mrpOff = Math.max(0, Math.round((t.savings - coupon) * 100) / 100);
  return (
    <div className="ax-sum">
      <h2>{title}</h2>
      <dl>
        <div><dt>Items ({t.count}) at MRP</dt><dd>{formatINR(t.mrpTotal)}</dd></div>
        {mrpOff > 0 && <div className="good"><dt>Discount</dt><dd>− {formatINR(mrpOff)}</dd></div>}
        {coupon > 0 && <div className="good"><dt>Coupon{t.coupon ? <> <code>{t.coupon.code}</code></> : null}</dt><dd>− {formatINR(coupon)}</dd></div>}
        <div className={t.delivery === 0 ? "good" : ""}><dt>Delivery</dt><dd>{t.count === 0 ? "—" : t.delivery === 0 ? "Free" : formatINR(t.delivery)}</dd></div>
        <div className="total"><dt>{payLabel}</dt><dd>{formatINR(t.total)}</dd></div>
      </dl>
      <p className="ax-sum-note">Prices are inclusive of all taxes.{BUSINESS.gstin ? " A GST invoice comes with your order." : ""}</p>
      {t.savings > 0 && <p className="ax-sum-save">You save {formatINR(t.savings)} on this order</p>}
      {children}
    </div>
  );
}
