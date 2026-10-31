/**
 * After checkout (/order/:id): the order is placed, what happens next, and the
 * order itself. Opened again later from this browser it loads the order with
 * the token saved at checkout; elsewhere it points to order tracking. A fresh
 * order gets a celebration (a drawn tick, ripples and confetti, still for
 * people who ask for less motion). Styles: src/buy.css (.ax-done-*, .ax-ov).
 */
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { Banknote, Building2, Check, Clock, Copy, CreditCard, Gift, Hash, Loader2, Package, PhoneCall, Truck } from "lucide-react";
import { OrderView } from "@/components/store/OrderView";
import { BuySteps } from "@/components/shop/BuyKit";
import { dayText, deliveryWindow } from "@/lib/store/delivery";
import { etaWindow, useEta } from "@/components/store/StoreExtras3";
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
  const { data: eta } = useEta(order?.address.pincode ?? "");

  useEffect(() => {
    let live = true;
    getOrder(id, token)
      .then((r) => { if (live) { setOrder(r.order); setState("ok"); } })
      .catch(() => { if (live && !order) setState("missing"); });
    return () => { live = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "loading") {
    return <div className="ax-cart-page ax-done-page"><div className="ax-wrap ax-co-done ax-done-wait"><Loader2 size={28} className="spin" /><p className="lead">Loading your order…</p></div></div>;
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

  // On a gift the address is the recipient's: the thanks uses the name it's from, if any.
  const words = (order.gift ? order.gift.from ?? "" : order.address.name).trim().split(/\s+/);
  const first = /^dr\.?$/i.test(words[0]) && words[1] ? `Dr ${words[1]}` : words[0];
  const fresh = Date.now() - order.createdAt < 30 * 60_000 && order.status === "placed";
  const due = order.status === "pending";
  const paidOnline = order.payment === "online" && order.paymentStatus === "paid";
  const paidBank = order.payment === "bank" && order.paymentStatus === "paid";
  const bankDue = due && order.payment === "bank";
  const w = eta ? etaWindow(eta) : deliveryWindow(new Date(order.createdAt));

  return (
    <div className="ax-cart-page ax-done-page">
      <section className={`ax-done-hero${due ? " due" : ""}`}>
        {fresh && <Confetti />}
        <div className="ax-wrap">
          {(fresh || due) && <BuySteps at={due ? 2 : 4} />}
          <div className="ax-co-done">
            <span className={due ? "ok wait" : fresh ? "ok" : "ok plain"}>
              {due ? <Clock size={36} /> : <svg className="draw" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
            </span>
            <p className="ax-eyebrow c">{due ? "Payment due" : fresh ? "Order placed" : "Your order"}</p>
            <h1>{bankDue ? (first ? `Thank you, ${first}` : "Thank you") : due ? "Almost there" : fresh ? (first ? `Thank you, ${first}` : "Thank you") : `Order ${order.id}`}</h1>
            {bankDue && <p className="lead">Your order <b>{order.id}</b> is saved. Send {formatINR(order.total)} by bank transfer to the account below, with <b>{order.id}</b> as the reference: we confirm the order once it arrives.{order.address.email ? " The details are in your email too." : ""}</p>}
            {due && !bankDue && <p className="lead">Your order <b>{order.id}</b> is waiting for its payment of {formatINR(order.total)}. Pay below, or choose cash on delivery.</p>}
            {fresh && <p className="lead">Your {order.gift ? "gift" : "order"} <b>{order.id}</b> for {formatINR(order.total)} is placed{paidOnline || paidBank ? " and paid" : ""}. {order.address.email ? "We've emailed you the details." : "Save the order number to track it."}</p>}
            {(fresh || due) && (
              <div className="ax-done-chips">
                <CopyChip id={order.id} />
                {fresh && <span><Truck size={15} /> Arrives {dayText(w.from)} – {dayText(w.to)}</span>}
                <span>{paidOnline ? <><CreditCard size={15} /> Paid online</> : paidBank ? <><Building2 size={15} /> Paid by bank transfer</> : bankDue ? <><Building2 size={15} /> {formatINR(order.total)} by bank transfer</> : due ? <><Clock size={15} /> {formatINR(order.total)} to pay</> : <><Banknote size={15} /> Cash on delivery</>}</span>
                {order.gift && <span><Gift size={15} /> Gift</span>}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="ax-wrap ax-done-body">
        <div className="in">
          {fresh && (
            <ol className="ax-next" aria-label="What happens next">
              <li><PhoneCall size={18} /><span><b>We confirm it</b><small>We may call {order.address.phone.replace(/^(\d{2})\d{4}/, "$1••••")} to confirm the order and address.</small></span></li>
              <li><Truck size={18} /><span><b>It ships</b><small>{BUSINESS.dispatch[0].toUpperCase() + BUSINESS.dispatch.slice(1)}; delivery is {BUSINESS.delivery}.</small></span></li>
              {paidOnline || paidBank
                ? <li><CreditCard size={18} /><span><b>Nothing to pay at {order.gift ? "the" : "your"} door</b><small>You&apos;ve paid {formatINR(order.total)} {paidBank ? "by bank transfer" : "online"}.</small></span></li>
                : order.gift
                  ? <li><Banknote size={18} /><span><b>Paid at the door</b><small>Whoever receives it pays {formatINR(order.total)} in cash.</small></span></li>
                  : <li><Banknote size={18} /><span><b>Pay at your door</b><small>Keep {formatINR(order.total)} ready in cash.</small></span></li>}
            </ol>
          )}
          <OrderView order={order} token={token} onChange={setOrder} />
          <div className="ax-co-next">
            <Link href="/shop" className="ax-btn teal lg ax-shine">Continue shopping</Link>
            <Link href="/orders" className="ax-btn lg">My orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The order number, to copy. */
function CopyChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }} aria-label={`Copy the order number ${id}`}>
      <Hash size={15} /> <code>{id}</code> {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

const CONFETTI = ["#2b7a6f", "#5fd3c0", "#6375e0", "#f5b544", "#f97066", "#12b76a"];
/** A short burst of confetti over the hero (decoration only). */
function Confetti() {
  const r = (i: number, n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return (
    <div className="ax-confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i key={i} style={{
          ["--l" as string]: `${(4 + r(i, 1) * 92).toFixed(1)}%`, ["--c" as string]: CONFETTI[i % CONFETTI.length],
          ["--t" as string]: `${(2.3 + r(i, 2) * 1.5).toFixed(2)}s`, ["--w" as string]: `${(r(i, 3) * 0.9).toFixed(2)}s`,
          ["--x" as string]: `${Math.round((r(i, 4) - 0.5) * 180)}px`, ["--y" as string]: `${Math.round(280 + r(i, 6) * 180)}px`, ["--r" as string]: `${Math.round(240 + r(i, 5) * 620)}deg`,
        }} />
      ))}
    </div>
  );
}
