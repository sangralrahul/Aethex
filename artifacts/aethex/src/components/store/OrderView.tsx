/**
 * One order as the customer sees it: progress, items, totals, delivery
 * address, courier details and cancelling (until it ships). Used by the order
 * confirmation, order tracking and my orders. Styles: src/shop.css (.ax-ov).
 */
import { useState } from "react";
import { Link } from "wouter";
import { Banknote, Check, CheckCircle2, Copy, ExternalLink, Loader2, MapPin, Package, PackageCheck, Truck, XCircle } from "lucide-react";
import { cancelOrder, type CustomerOrder } from "@/lib/store/api";
import { STATUS_LABEL } from "@/lib/store/rules";
import { formatINR } from "@/lib/utils";
import { BUSINESS } from "@/config/business";
import { ProductImage } from "./ProductImage";
import { isBookId, itemHref } from "@/lib/store/bookdata";

const STEPS = [
  { key: "placed", label: "Placed", icon: Package },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
] as const;

export const when = (ms: number) => new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function OrderView({ order, token, phone, onChange, compact = false }: {
  order: CustomerOrder; token?: string; phone?: string; onChange?: (o: CustomerOrder) => void; compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cancelled = order.status === "cancelled";
  const reached = STEPS.findIndex((s) => s.key === order.status);
  const at = (k: string) => order.history.find((h) => h.status === k)?.at;
  const a = order.address;

  const doCancel = async () => {
    setBusy(true); setErr("");
    try {
      const r = await cancelOrder(order.id, { token, phone, reason: reason.trim() || undefined });
      onChange?.(r.order);
      setAsking(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
        <div className="ax-ov-cancelled"><XCircle size={18} /><span>This order was cancelled{at("cancelled") ? ` on ${when(at("cancelled")!)}` : ""}. Nothing is due.</span></div>
      ) : (
        <ol className="ax-ov-steps" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className={i <= reached ? "done" : ""} aria-current={i === reached ? "step" : undefined}>
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
          <ul className="ax-ov-items">
            {order.lines.map((l) => (
              <li key={`${l.productId}:${l.variantId ?? ""}`}>
                <Link href={itemHref(l.productId, l.slug)} className="img"><ProductImage src={l.image} width={120} book={isBookId(l.productId)} /></Link>
                <span><Link href={itemHref(l.productId, l.slug)}>{l.name}</Link><em>{l.variantLabel ? `${l.variantLabel} · ` : ""}Qty {l.qty} × {formatINR(l.price)}</em></span>
                <b>{formatINR(l.lineTotal)}</b>
              </li>
            ))}
          </ul>
          <div className="ax-ov-foot">
            <dl>
              <div><dt>Items</dt><dd>{formatINR(order.subtotal)}</dd></div>
              <div><dt>Delivery</dt><dd>{order.delivery ? formatINR(order.delivery) : "Free"}</dd></div>
              <div className="total"><dt>{cancelled ? "Total" : "To pay on delivery"}</dt><dd>{formatINR(order.total)}</dd></div>
            </dl>
            <div className="ax-ov-addr">
              <p><MapPin size={15} /> <span><b>{a.name}</b>{a.line1 ? <><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? `, near ${a.landmark}` : ""}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</span></p>
              <p><Banknote size={15} /> <span>Cash on delivery</span></p>
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
              <label className="f"><span>Why are you cancelling? <em>(optional)</em></span><input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} /></label>
              <div className="row">
                <button type="button" className="ax-btn danger" onClick={doCancel} disabled={busy}>{busy ? <Loader2 size={16} className="spin" /> : null} Yes, cancel the order</button>
                <button type="button" className="ax-btn" onClick={() => setAsking(false)} disabled={busy}>Keep it</button>
              </div>
              {err && <p className="ax-form-err" role="alert">{err}</p>}
            </div>
          )}
        </div>
      )}
      {!compact && <p className="ax-ov-help">Questions about this order? Write to <a href={`mailto:${BUSINESS.email}?subject=${encodeURIComponent(`Order ${order.id}`)}`}>{BUSINESS.email}</a>{BUSINESS.phone ? <> or call {BUSINESS.phone}</> : null} with your order number.</p>}
    </div>
  );
}
