/**
 * One order as the customer sees it: progress, items, totals, delivery
 * address, how it's paid (cash on delivery, online: paying again or switching
 * to cash while the payment is due, and refunds, or by bank transfer: the
 * account to pay into while it's due), a gift's message, a business buyer,
 * courier details, buying it all again,
 * cancelling (until it ships) and, once delivered, reviewing what was bought.
 * Used by the order confirmation, order tracking and my orders. The progress
 * line fills up step by step when the order opens.
 * Styles: src/buy.css (.ax-ov).
 */
import { ReportProblem, WhatsAppOrder } from "@/components/store/StoreExtras2";
import { useState } from "react";
import { Link } from "wouter";
import {
  Banknote, Briefcase, Building2, Check, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Gift, Loader2, MapPin, Package, PackageCheck, PenLine, RotateCcw, Star, Truck, XCircle, FileText } from "lucide-react";
import { cancelOrder, payOrder, retryPayment, switchToCod, type CustomerOrder } from "@/lib/store/api";
import { payWithRazorpay } from "@/lib/store/razorpay";
import { COD_LIMIT, STATUS_LABEL } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";
import { BUSINESS } from "@/config/business";
import { ProductImage } from "./ProductImage";
import { ReviewDialog, Stars, type ReviewTarget } from "./Reviews";
import { isBookId, itemHref } from "@/lib/store/bookdata";
import { BuyAgainButton } from "@/components/shop/BuyAgain";

const STEPS = [
  { key: "placed", label: "Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

export const when = (ms: number) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const day = (ms: number) => new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "Cash on delivery", "Paid online on 21 Oct 2026", "Refunded", "Online payment due". */
export function paymentText(o: CustomerOrder): string {
  if (o.payment === "cod") return "Cash on delivery";
  if (o.payment === "bank") {
    if (o.paymentStatus === "paid") return `Paid by bank transfer${o.paidAt ? ` on ${day(o.paidAt)}` : ""}`;
    return o.status === "cancelled" ? "Not paid" : "Bank transfer due";
  }
  if (o.paymentStatus === "refunded") return `Paid online, refunded${o.refund ? ` on ${day(o.refund.at)}` : ""}`;
  if (o.paymentStatus === "paid") return `Paid online${o.paidAt ? ` on ${day(o.paidAt)}` : ""}${o.refund ? `, ${formatINR(o.refund.amount)} refunded` : ""}`;
  return o.status === "cancelled" ? "Not paid" : "Online payment due";
}

export function OrderView({ order, token, phone, onChange, compact = false }: {
  order: CustomerOrder; token?: string; phone?: string; onChange?: (o: CustomerOrder) => void; compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"" | "cancel" | "pay" | "cod">("");
  const [err, setErr] = useState("");
  const [payErr, setPayErr] = useState("");
  const [reviewing, setReviewing] = useState<ReviewTarget | null>(null);
  const cancelled = order.status === "cancelled";
  const due = order.status === "pending";
  const paid = order.payment !== "cod" && (order.paymentStatus === "paid" || order.paymentStatus === "refunded");
  const bankDue = due && order.payment === "bank";
  const reached = STEPS.findIndex((s) => s.key === order.status);
  const at = (k: string) => [...order.history].reverse().find((h) => h.status === k)?.at;
  const a = order.address;
  const access = { token, phone };

  const doCancel = async () => {
    setBusy("cancel"); setErr("");
    try {
      const r = await cancelOrder(order.id, { ...access, reason: reason.trim() || undefined });
      onChange?.(r.order);
      setAsking(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const payNow = async () => {
    setBusy("pay"); setPayErr("");
    try {
      const r = await retryPayment(order.id, access);
      if (!r.checkout) { onChange?.(r.order); return; }
      const out = await payWithRazorpay(r.checkout);
      if ("paid" in out) onChange?.((await payOrder(order.id, out.paid, access)).order);
      else setPayErr(out.failure ? `${out.failure} No money is taken for a failed payment: try again, or pay cash on delivery.` : "The payment wasn't completed. Try again when you're ready.");
    } catch (e) {
      setPayErr((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const toCod = async () => {
    setBusy("cod"); setPayErr("");
    try { onChange?.((await switchToCod(order.id, access)).order); } catch (e) { setPayErr((e as Error).message); } finally { setBusy(""); }
  };

  const cancelledText = (() => {
    const on = at("cancelled") ? ` on ${when(at("cancelled")!)}` : "";
    if (order.refund) return `This order was cancelled${on}. We've refunded ${formatINR(order.refund.amount)} to the account, card or UPI app you paid with; it usually reaches you in 5 to 7 business days.`;
    if (paid && order.payment === "bank") return `This order was cancelled${on}. We'll send your bank transfer of ${formatINR(order.total)} back to the account it came from, and email you when it's on its way.`;
    if (paid) return `This order was cancelled${on}. Your payment of ${formatINR(order.total)} will be refunded; we'll email you when it's on its way.`;
    return `This order was cancelled${on}. Nothing is due.`;
  })();

  return (
    <div className={`ax-ov${compact ? " compact" : ""}`}>
      <div className="ax-ov-head">
        <div>
          <small>Order number</small>
          <b>{order.id}</b>
          <button type="button" className="cp" onClick={() => { navigator.clipboard?.writeText(order.id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }} aria-label="Copy the order number">
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div><small>Placed</small><span>{when(order.createdAt)}</span></div>
        <div><small>Total</small><span className="tot">{formatINR(order.total)}</span></div>
        <span className={`ax-ov-status s-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      {cancelled ? (
        <div className="ax-ov-cancelled"><XCircle size={18} /><span>{cancelledText}</span></div>
      ) : bankDue ? (
        <div className="ax-ov-due bank">
          <Building2 size={19} />
          <div>
            <b>Send {formatINR(order.total)} by bank transfer</b>
            <p>Pay by NEFT, RTGS or IMPS to this account, with your order number as the reference. We confirm the order once the money arrives; if it hasn&apos;t in 3 days, the order is cancelled.</p>
            {order.bank ? (
              <dl className="ax-bank">
                <BankRow k="Amount" v={String(order.total)} show={formatINR(order.total)} />
                <BankRow k="Account name" v={order.bank.accountName} />
                <BankRow k="Account number" v={order.bank.accountNumber} />
                <BankRow k="IFSC" v={order.bank.ifsc} />
                {order.bank.bankName && <BankRow k="Bank" v={order.bank.bankName} copy={false} />}
                <BankRow k="Reference" v={order.id} />
              </dl>
            ) : <p>The account details are in the email we sent you.</p>}
            {order.total <= COD_LIMIT && (
              <div className="row"><button type="button" className="ax-btn" onClick={toCod} disabled={!!busy}>{busy === "cod" ? <Loader2 size={16} className="spin" /> : <Banknote size={16} />} Pay cash on delivery instead</button></div>
            )}
            {payErr && <p className="ax-form-err" role="alert">{payErr}</p>}
          </div>
        </div>
      ) : due ? (
        <div className="ax-ov-due">
          <Clock size={19} />
          <div>
            <b>Waiting for your payment of {formatINR(order.total)}</b>
            <p>Your order is kept for a day. If you've paid already, it shows here within a few minutes.</p>
            <div className="row">
              <button type="button" className="ax-btn teal ax-shine" onClick={payNow} disabled={!!busy}>{busy === "pay" ? <Loader2 size={16} className="spin" /> : <CreditCard size={16} />} Pay {formatINR(order.total)} now</button>
              {order.total <= COD_LIMIT && <button type="button" className="ax-btn" onClick={toCod} disabled={!!busy}>{busy === "cod" ? <Loader2 size={16} className="spin" /> : <Banknote size={16} />} Pay cash on delivery instead</button>}
            </div>
            {payErr && <p className="ax-form-err" role="alert">{payErr}</p>}
          </div>
        </div>
      ) : (
        <ol className="ax-ov-steps" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`${i <= reached ? "done" : ""}${i === reached ? " now" : ""}`} aria-current={i === reached ? "step" : undefined} style={{ ["--i" as string]: i }}>
              <span className="ic"><s.icon size={16} /></span>
              <b>{s.label}</b>
              {at(s.key) ? <small>{when(at(s.key)!)}</small> : <small>&nbsp;</small>}
            </li>
          ))}
        </ol>
      )}

      {order.tracking && (order.tracking.courier || order.tracking.number) && !cancelled && (
        <p className="ax-ov-track"><Truck size={16} /> <span>{order.tracking.courier}{order.tracking.number ? <> · Tracking number <b>{order.tracking.number}</b></> : null}</span>
          {order.tracking.url && <a href={order.tracking.url} target="_blank" rel="noopener noreferrer">Track with the courier <ExternalLink size={13} /></a>}</p>
      )}

      {!compact && (
        <>
          {order.status === "delivered" && <p className="ax-ov-rate"><Star size={15} /> How was it? Your review helps other buyers, and we read every one.</p>}
          <ul className="ax-ov-items">
            {order.lines.map((l) => {
              const rv = order.reviews?.[l.productId];
              return (
                <li key={`${l.productId}:${l.variantId ?? ""}`}>
                  <Link href={itemHref(l.productId, l.slug)} className="img"><ProductImage src={l.image} width={120} book={isBookId(l.productId)} /></Link>
                  <span>
                    <Link href={itemHref(l.productId, l.slug)}>{l.name}</Link><em>{l.variantLabel ? `${l.variantLabel} · ` : ""}Qty {l.qty} × {formatINR(l.price)}</em>
                    {order.status === "delivered" && <ReportProblem order={order} line={l} access={access} onDone={(reps) => onChange?.({ ...order, replacements: reps })} />}
                    {order.status === "delivered" && (
                      <span className="rv">
                        {rv && <><Stars value={rv.rating} size={13} /> <small>{rv.status === "approved" ? "Your review is live" : rv.status === "pending" ? "Review sent: we're checking it" : "Your review wasn't published"}</small></>}
                        <button type="button" className="ax-link" onClick={() => setReviewing({ orderId: order.id, productId: l.productId, name: l.name, existing: rv })}>
                          <PenLine size={13} /> {rv ? "Change" : "Write a review"}
                        </button>
                      </span>
                    )}
                  </span>
                  <b>{formatINR(l.lineTotal)}</b>
                </li>
              );
            })}
          </ul>
          <div className="ax-ov-foot">
            <dl>
              <div><dt>Items</dt><dd>{formatINR(order.subtotal)}</dd></div>
              {!!order.discount && <div className="good"><dt>Coupon{order.coupon ? ` ${order.coupon}` : ""}</dt><dd>− {formatINR(order.discount)}</dd></div>}
              <div><dt>Delivery</dt><dd>{order.delivery ? formatINR(order.delivery) : "Free"}</dd></div>
              <div className="total"><dt>{cancelled ? "Total" : paid ? (order.payment === "bank" ? "Paid by bank transfer" : "Paid online") : bankDue ? "To pay by bank transfer" : due ? "To pay now" : "To pay on delivery"}</dt><dd>{formatINR(order.total)}</dd></div>
              {order.refund && <div className="good"><dt>Refunded</dt><dd>{formatINR(order.refund.amount)}</dd></div>}
            </dl>
            <div className="ax-ov-addr">
              <p><MapPin size={15} /> <span><b>{a.name}</b>{a.line1 ? <><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? `, near ${a.landmark}` : ""}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</span></p>
              <p>{order.refund ? <RotateCcw size={15} /> : order.payment === "online" ? <CreditCard size={15} /> : order.payment === "bank" ? <Building2 size={15} /> : <Banknote size={15} />} <span>{paymentText(order)}</span></p>
              {order.gift && <p className="gift"><Gift size={15} /> <span><b>Gift</b>{order.gift.message ? <><br />&ldquo;{order.gift.message}&rdquo;</> : null}{order.gift.from ? <><br />From {order.gift.from}</> : null}</span></p>}
              {order.business && <p><Briefcase size={15} /> <span><b>{order.business.name}</b>{order.business.gstin ? <><br />GSTIN {order.business.gstin}</> : null}</span></p>}
            </div>
          </div>
        </>
      )}

      {order.canCancel && !cancelled && (
        <div className="ax-ov-cancel">
          {!asking ? (
            <button type="button" className="ax-link danger" onClick={() => setAsking(true)}>Cancel this order</button>
          ) : (
            <div className="ax-ov-cancel-box">
              {paid && <p className="fine">Your payment of {formatINR(order.total)} {order.payment === "bank" ? "is sent back to the bank account it came from" : "is refunded to the account, card or UPI app you paid with"}.</p>}
              <label className="f"><span>Why are you cancelling? <em>(optional)</em></span><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} /></label>
              <div className="row">
                <button type="button" className="ax-btn danger" onClick={doCancel} disabled={!!busy}>{busy === "cancel" ? <Loader2 size={16} className="spin" /> : null} Yes, cancel the order</button>
                <button type="button" className="ax-btn" onClick={() => setAsking(false)} disabled={!!busy}>Keep it</button>
              </div>
              {err && <p className="ax-form-err" role="alert">{err}</p>}
            </div>
          )}
        </div>
      )}
      {!due && order.lines.length > 0 && (
        <div className="ax-ov-again"><BuyAgainButton lines={order.lines} label={cancelled ? "Order these again" : "Buy it all again"} />{!compact && order.status !== "pending" && <Link href={`/orders/${order.id}/invoice`} className="ax-btn" data-store="invoice-link"><FileText size={16} /> {order.business ? "Invoice (PDF)" : "Receipt (PDF)"}</Link>}</div>
      )}
      {!compact && !due && <WhatsAppOrder order={order} />}
      {!compact && <p className="ax-ov-help">Questions about this order? Write to <a href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Order ${order.id}`)}`}>{BUSINESS.email}</a>{BUSINESS.phone ? <> or call {BUSINESS.phone}</> : null} with your order number.</p>}

      <ReviewDialog
        target={reviewing}
        access={access}
        onClose={() => setReviewing(null)}
        onDone={(productId, status, r) => {
          onChange?.({ ...order, reviews: { ...(order.reviews ?? {}), [productId]: { status, rating: r.rating, body: r.body, name: r.name, ...(r.title ? { title: r.title } : {}), ...(r.city ? { city: r.city } : {}) } } });
        }}
      />
    </div>
  );
}

/** One line of the bank account, with a button to copy it. */
function BankRow({ k, v, show, copy = true }: { k: string; v: string; show?: string; copy?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <div>
      <dt>{k}</dt>
      <dd><span>{show ?? v}</span>{copy && (
        <button type="button" onClick={() => { navigator.clipboard?.writeText(v).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {}); }} aria-label={`Copy the ${k.toLowerCase()}`}>
          {done ? <Check size={13} /> : <Copy size={13} />}
        </button>
      )}</dd>
    </div>
  );
}
