/** The order summary box (cart and checkout), from a priced quote (lib/store/rules). Styles: src/shop.css (.ax-sum). */
import type { ReactNode } from "react";
import { formatINR } from "@/lib/utils";
import type { Quote } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";

export function OrderSummary({ quote: t, children, title = "Order summary" }: { quote: Pick<Quote, "count" | "subtotal" | "mrpTotal" | "savings" | "delivery" | "total">; children?: ReactNode; title?: string }) {
  return (
    <div className="ax-sum">
      <h2>{title}</h2>
      <dl>
        <div><dt>Items ({t.count}) at MRP</dt><dd>{formatINR(t.mrpTotal)}</dd></div>
        {t.savings > 0 && <div className="good"><dt>Discount</dt><dd>− {formatINR(t.savings)}</dd></div>}
        <div className={t.delivery === 0 ? "good" : ""}><dt>Delivery</dt><dd>{t.count === 0 ? "—" : t.delivery === 0 ? "Free" : formatINR(t.delivery)}</dd></div>
        <div className="total"><dt>To pay on delivery</dt><dd>{formatINR(t.total)}</dd></div>
      </dl>
      <p className="ax-sum-note">Prices are inclusive of all taxes.{BUSINESS.gstin ? " A GST invoice comes with your order." : ""}</p>
      {t.savings > 0 && <p className="ax-sum-save">You save {formatINR(t.savings)} on this order</p>}
      {children}
    </div>
  );
}
