/**
 * After checkout (/order/:id): the order is placed, what happens next, and the
 * order itself. Opened again later from this browser it loads the order with
 * the token saved at checkout; elsewhere it points to order tracking.
 * Styles: src/shop.css (.ax-co-done, .ax-ov).
 */
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { CheckCircle2, Loader2, Package, PhoneCall, Truck, Banknote } from "lucide-react";
import { OrderView } from "@/components/store/OrderView";
import { useSeo } from "@/hooks/use-seo";
import { getOrder, tokenFor, type CustomerOrder } from "@/lib/store/api";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";

export default function OrderPlaced() {
  const [, params] = useRoute("/order/:id");
  const id = (params?.id || "").toUpperCase();
  useSeo({ title: "Order placed | Aethex Store", description: "Your Aethex order.", path: "/order" });
  const token = tokenFor(id);
  const [order, setOrder] = useState<CustomerOrder | null>(() => {
    try { const s = sessionStorage.getItem(`aethex:placed:${id}`); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [state, setState] = useState<"loading" | "ok" | "missing">(order ? "ok" : "loading");

  useEffect(() => {
    let live = true;
    getOrder(id, token)
      .then((r) => { if (live) { setOrder(r.order); setState("ok"); } })
      .catch(() => { if (live && !order) setState("missing"); });
    return () => { live = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") {
    return <div className="ax-cart-page"><div className="ax-wrap ax-co-done"><Loader2 size={28} className="spin" /><p className="lead">Loading your order…</p></div></div>;
  }
  if (state === "missing" || !order) {
    return (
      <div className="ax-cart-page">
        <div className="ax-wrap"><div className="ax-empty" style={{ margin: "48px 0" }}>
          <span className="ic"><Package size={26} /></span>
          <h2>Find your order with its number and phone</h2>
          <p>For your privacy, orders open only in the browser that placed them, or in your account.</p>
          <div className="acts"><Link href={`/orders/track?order=${encodeURIComponent(id)}`} className="ax-btn teal">Track order {id}</Link></div>
        </div></div>
      </div>
    );
  }

  const words = order.address.name.trim().split(/\s+/);
  const first = /^dr\.?$/i.test(words[0]) && words[1] ? `Dr ${words[1]}` : words[0];
  const fresh = Date.now() - order.createdAt < 30 * 60_000 && order.status === "placed";

  return (
    <div className="ax-cart-page">
      <div className="ax-wrap ax-co-done">
        <span className="ok"><CheckCircle2 size={34} /></span>
        <p className="ax-eyebrow c">{fresh ? "Order placed" : "Your order"}</p>
        <h1>{fresh ? `Thank you, ${first}` : `Order ${order.id}`}</h1>
        {fresh && <p className="lead">Your order <b>{order.id}</b> for {formatINR(order.total)} is placed. {order.address.email ? "We've emailed you the details." : "Save the order number to track it."}</p>}
        {fresh && (
          <ol className="ax-next">
            <li><PhoneCall size={18} /><span><b>We confirm it</b><small>We may call {order.address.phone.replace(/^(\d{2})\d{4}/, "$1••••")} to confirm the order and address.</small></span></li>
            <li><Truck size={18} /><span><b>It ships</b><small>{BUSINESS.dispatch[0].toUpperCase() + BUSINESS.dispatch.slice(1)}; delivery is {BUSINESS.delivery}.</small></span></li>
            <li><Banknote size={18} /><span><b>Pay at your door</b><small>Keep {formatINR(order.total)} ready in cash.</small></span></li>
          </ol>
        )}
        <OrderView order={order} token={token} onChange={setOrder} />
        <div className="ax-co-next">
          <Link href="/shop" className="ax-btn teal lg">Continue shopping</Link>
          <Link href="/orders" className="ax-btn lg">My orders</Link>
        </div>
      </div>
    </div>
  );
}
