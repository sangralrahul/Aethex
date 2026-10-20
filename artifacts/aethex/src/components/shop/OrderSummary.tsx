/** The order summary box (cart and checkout). Totals follow lib/shop.ts. Styles: src/shop.css (.ax-sum). */
import type { ReactNode } from "react";
import { formatINR } from "@/lib/utils";
import { cartTotals } from "@/lib/shop";

export type Line = { id: number; productId: number; name: string; price: number; originalPrice?: number; imageUrl: string; brand?: string; quantity: number };

export function OrderSummary({ lines, children }: { lines: Line[]; children?: ReactNode }) {
  const t = cartTotals(lines);
  return (
    <div className="ax-sum">
      <h2>Order summary</h2>
      <dl>
        <div><dt>Items ({t.count})</dt><dd>{formatINR(t.mrp)}</dd></div>
        {t.savings > 0 && <div className="good"><dt>Discount</dt><dd>− {formatINR(t.savings)}</dd></div>}
        <div className={t.delivery === 0 ? "good" : ""}><dt>Delivery</dt><dd>{t.delivery === 0 ? "Free" : formatINR(t.delivery)}</dd></div>
        <div className="total"><dt>Total</dt><dd>{formatINR(t.total)}</dd></div>
      </dl>
      <p className="ax-sum-note">Prices include GST. A GST invoice comes with your order.</p>
      {t.savings > 0 && <p className="ax-sum-save">You save {formatINR(t.savings)} on this order</p>}
      {children}
    </div>
  );
}

