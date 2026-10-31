/**
 * The store admin (/admin), for the accounts in ADMIN_EMAILS: orders (confirm,
 * ship with tracking, deliver, cancel, refund online payments; download as
 * CSV), price and book requests, bulk quotation requests from hospitals and
 * medical colleges (with a note they see in their account), products and
 * medical books (set prices for price-on-request brands and books, MRP, stock,
 * country of origin, hide), offers and coupon codes, and buyers' reviews to
 * approve or reply to. Talks to /api/store/admin/* (worker/store.ts).
 * Styles: src/shop.css (.ax-adm).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, BadgePercent, Building2, Check, ClipboardList, Copy, CreditCard, Download, ExternalLink, Inbox, Loader2, LogIn, Mail, Package, RefreshCw, RotateCcw, Search,
  Gift, MessageCircleQuestion, Percent, PhoneCall, ShieldCheck, Star, Store, Truck, Wallet,
} from "lucide-react";
import { Stars } from "@/components/store/Reviews";
import { couponText, offerLive } from "@/lib/store/promo";
import { useSeo } from "@/hooks/use-seo";
import { storeFetch, StoreError, useBooks, useStore, type ProductQuestion, type Replacement, type TaxTable } from "@/lib/store/api";
import { BUSINESS } from "@/config/business";
import { bookSummary, isBookId, itemHref } from "@/lib/store/bookdata";
import type { BulkRequest, BulkStatus, Coupon, Offer, Order, OrderStatus, Override, ProductSummary, Review, ReviewStatus } from "@/lib/store/types";
import { BULK_STATUS_LABEL, BULK_STATUSES, everyText, formatDay, ORDER_STATUSES, scheduleText, STATUS_LABEL } from "@/lib/store/rules";
import { ProductImage } from "@/components/store/ProductImage";
import { when } from "@/components/store/OrderView";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";
import { CreditAdmin, printGiftSlip } from "@/components/store/StoreExtras3";

type AdminOrder = Order & { adminNote: string; updatedAt: number; userId: string | null; paymentId?: string };
type AdminBulk = BulkRequest & { adminNote: string; updatedAt: number };
type Enquiry = { id: string; created_at: number; kind: string; item: string | null; name: string; phone: string; email: string | null; city: string | null; qty: number; message: string | null; status: string; note: string | null; product: { id: number; slug: string; name: string; brand: string } | null };
type Summary = {
  orders: Record<string, { count: number; total: number }>; last24h: { count: number; total: number }; openEnquiries: number; openBulk: number; pendingReviews?: number; pendingQuestions?: number; openReplacements?: number; bankWaiting?: number; callbacks?: number;
  catalog: { products: number; priceOnRequest: number; noOrigin: number; hidden: number; outOfStock: number };
  setup: { email: boolean; storeEmail: string; admins: number; gaps: string[]; onlinePayments?: boolean; razorpayMode?: string; webhook?: boolean; webhookUrl?: string; bankTransfer?: boolean; whatsapp?: boolean };
};
type Tab = "overview" | "orders" | "requests" | "bulk" | "products" | "promos" | "reviews" | "questions" | "tax" | "replacements" | "credit";

const admin = <T,>(path: string, init?: { method?: string; json?: unknown }) => storeFetch<T>(`/admin/${path}`, init);

export default function StoreAdmin() {
  useSeo({ title: "Store admin | Aethex", description: "Orders, requests and products.", path: "/admin" });
  const [gate, setGate] = useState<"checking" | "ok" | "signin" | "setup" | "denied" | "error">("checking");
  const [gateMsg, setGateMsg] = useState("");
  const [me, setMe] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    admin<{ email: string }>("me").then((r) => { setMe(r.email); setGate("ok"); }).catch((e: StoreError) => {
      setGateMsg(e.message);
      setGate(e.status === 401 ? "signin" : e.data?.setup ? "setup" : e.status === 403 ? "denied" : "error");
    });
  }, []);

  if (gate !== "ok") {
    return (
      <div className="ax-adm-gate">
        <div className="card">
          <ShieldCheck size={30} />
          <h1>Store admin</h1>
          {gate === "checking" && <p><Loader2 size={16} className="spin" /> Checking your account…</p>}
          {gate === "signin" && <><p>Sign in with an admin account to manage orders, requests and prices.</p><a className="ax-btn teal lg" href={loginUrl("/", { next: "/admin" })}><LogIn size={17} /> Sign in</a></>}
          {gate === "setup" && <><p>{gateMsg}</p><pre>npx wrangler secret put ADMIN_EMAILS</pre><p className="fine">Enter your account's email (several: separate them with commas), then reload this page. Optionally set STORE_EMAIL to the inbox that should get new orders.</p></>}
          {gate === "denied" && <p>{gateMsg}</p>}
          {gate === "error" && <><p>{gateMsg}</p><button type="button" className="ax-btn" onClick={() => window.location.reload()}><RefreshCw size={15} /> Try again</button></>}
          <Link href="/" className="ax-link">← Back to aethex.in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ax-adm">
      <header className="ax-adm-top">
        <div className="ax-wrap">
          <b><Store size={18} /> Store admin</b>
          <nav role="tablist">
            {([["overview", "Overview", ClipboardList], ["orders", "Orders", Package], ["requests", "Requests", Inbox], ["bulk", "Bulk", Building2], ["products", "Products", Store], ["promos", "Offers", BadgePercent], ["reviews", "Reviews", Star], ["questions", "Questions", MessageCircleQuestion], ["replacements", "Replacements", RotateCcw], ["credit", "Store credit", Wallet], ["tax", "Tax", Percent]] as const).map(([k, label, I]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><I size={15} /> {label}</button>
            ))}
          </nav>
          <span className="me">{me}</span>
        </div>
      </header>
      <div className="ax-wrap ax-adm-body">
        {tab === "overview" && <Overview go={setTab} />}
        {tab === "orders" && <Orders />}
        {tab === "requests" && <Requests />}
        {tab === "bulk" && <Bulk />}
        {tab === "products" && <Products />}
        {tab === "promos" && <Promos />}
        {tab === "reviews" && <Reviews />}
        {tab === "questions" && <Questions />}
        {tab === "tax" && <TaxRates />}
        {tab === "replacements" && <Replacements />}
        {tab === "credit" && <CreditAdmin admin={admin} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ overview */

function Overview({ go }: { go: (t: Tab) => void }) {
  const [s, setS] = useState<Summary | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { admin<Summary>("summary").then(setS).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="ax-form-err">{err}</p>;
  if (!s) return <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p>;
  const o = (k: string) => s.orders[k]?.count ?? 0;
  const pay = s.setup;
  const checks: [boolean, string][] = [
    [s.setup.email, s.setup.email ? "Order emails are on (Brevo)." : "Order emails are off: set BREVO_API_KEY (npx wrangler secret put BREVO_API_KEY)."],
    [!!pay.onlinePayments, pay.onlinePayments
      ? `Online payments are on (Razorpay, ${pay.razorpayMode === "live" ? "live: real payments" : "test mode: no real money moves"}).`
      : "Online payments are off: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (npx wrangler secret put RAZORPAY_KEY_ID). Until then, checkout offers cash on delivery only."],
    ...(pay.onlinePayments ? [[!!pay.webhook, pay.webhook
      ? "Razorpay's webhook is set, so payments count even if the customer closes the page."
      : `Optional: in Razorpay, add a webhook to ${pay.webhookUrl ?? "https://aethex.in/api/store/razorpay/webhook"} (payment.authorized, payment.captured, order.paid, refund.processed, refund.failed) and set its secret as RAZORPAY_WEBHOOK_SECRET. Until then the hourly check finds such payments.`] as [boolean, string]] : []),
    [!!pay.bankTransfer, pay.bankTransfer
      ? "Bank transfer is on at checkout (orders from ₹2,000): mark each one paid here when the money arrives."
      : "Optional: bank transfer for large orders. Set STORE_BANK_ACCOUNT_NAME, STORE_BANK_ACCOUNT_NUMBER and STORE_BANK_IFSC (npx wrangler secret put STORE_BANK_IFSC)."],
    [!!pay.whatsapp, pay.whatsapp ? "\"Order on WhatsApp\" shows on product pages and the cart." : "Optional: set STORE_WHATSAPP (the store's 10-digit WhatsApp number) to show \"Order on WhatsApp\"."],
    [true, `New orders and requests are emailed to ${s.setup.storeEmail}.`],
    [s.catalog.priceOnRequest === 0, s.catalog.priceOnRequest ? `${s.catalog.priceOnRequest} products are price on request: set prices under Products to sell them directly.` : "Every product has a price."],
    [s.catalog.noOrigin === 0, s.catalog.noOrigin ? `${s.catalog.noOrigin} products don't show a country of origin yet: add it under Products (it's on the pack).` : "Every product shows its country of origin."],
    ...s.setup.gaps.map((g) => [false, `Missing: ${g}`] as [boolean, string]),
  ];
  return (
    <div className="ax-adm-over">
      <div className="ax-adm-stats">
        <button type="button" onClick={() => go("orders")}><small>New orders</small><b>{o("placed")}</b><span>to confirm</span></button>
        {o("pending") > 0 && <button type="button" onClick={() => go("orders")}><small>Awaiting payment</small><b>{o("pending")}</b><span>{s.bankWaiting ? `${s.bankWaiting} by bank transfer` : "online, not paid yet"}</span></button>}
        {(s.callbacks ?? 0) > 0 && <button type="button" onClick={() => go("requests")}><small>Calls to make</small><b>{s.callbacks}</b><span>to take an order</span></button>}
        <button type="button" onClick={() => go("orders")}><small>To ship</small><b>{o("confirmed")}</b><span>confirmed</span></button>
        <button type="button" onClick={() => go("orders")}><small>On the way</small><b>{o("shipped")}</b><span>shipped</span></button>
        <button type="button" onClick={() => go("requests")}><small>Requests</small><b>{s.openEnquiries}</b><span>waiting for a reply</span></button>
        <button type="button" onClick={() => go("bulk")}><small>Bulk requests</small><b>{s.openBulk ?? 0}</b><span>to quote</span></button>
        <button type="button" onClick={() => go("reviews")}><small>Reviews</small><b>{s.pendingReviews ?? 0}</b><span>to check</span></button>
        <button type="button" onClick={() => go("questions")}><small>Questions</small><b>{s.pendingQuestions ?? 0}</b><span>to answer</span></button>
        <button type="button" onClick={() => go("replacements")}><small>Replacements</small><b>{s.openReplacements ?? 0}</b><span>open</span></button>
        <div><small>Last 24 hours</small><b>{s.last24h.count}</b><span>{formatINR(s.last24h.total)}</span></div>
        <div><small>Delivered</small><b>{o("delivered")}</b><span>{formatINR(s.orders.delivered?.total ?? 0)}</span></div>
      </div>
      <h2>Launch checklist</h2>
      <ul className="ax-adm-checks">
        {checks.map(([good, text], i) => <li key={i} className={good ? "good" : "todo"}>{good ? <Check size={16} /> : <AlertTriangle size={16} />} {text}</li>)}
      </ul>
      <p className="fine">Business details (address, GSTIN, phone, Grievance Officer) live in <code>src/config/business.ts</code>; they appear on the policy pages, product pages and order emails.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ orders */

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = { pending: ["cancelled"], placed: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"] };
const paidOnline = (o: Order) => o.payment === "online" && (o.paymentStatus === "paid" || o.paymentStatus === "refunded");
const PAY_TAG = (o: Order) => o.payment === "bank" ? (o.paymentStatus === "paid" ? "Bank, paid" : o.status === "pending" ? "Bank, waiting" : "Bank") : o.payment === "online" ? (paidOnline(o) ? "Online, paid" : "Online") : "COD";

function Orders() {
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState("");
  const [list, setList] = useState<AdminOrder[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => {
    setErr("");
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    admin<{ orders: AdminOrder[] }>(`orders?${p}`).then((r) => setList(r.orders)).catch((e) => setErr(e.message));
  }, [status, q]);
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  const csv = `/api/store/admin/orders.csv${status ? `?status=${status}` : ""}`;

  return (
    <div>
      <div className="ax-adm-bar">
        <div className="seg">
          {["", ...ORDER_STATUSES].map((s) => <button key={s} type="button" className={status === s ? "on" : ""} onClick={() => setStatus(s)}>{s ? STATUS_LABEL[s as OrderStatus] : "All"}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="find"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, name, phone or email" /></form>
        <a className="ax-btn" href={csv}><Download size={15} /> CSV</a>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">No orders here yet.</p> : (
        <ul className="ax-adm-list">
          {list.map((o) => (
            <li key={o.id} className={open === o.id ? "open" : ""}>
              <button type="button" className="row" onClick={() => setOpen(open === o.id ? null : o.id)}>
                <b>{o.id}</b>
                <span>{o.address.name} · {o.address.city} {o.address.pincode}</span>
                <span className="muted">{when(o.createdAt)}</span>
                <span className={`ax-ov-status s-${o.status}`}>{STATUS_LABEL[o.status]}</span>
                <span className={`ax-adm-pay p-${o.payment}`}>{PAY_TAG(o)}{o.gift ? <> · <Gift size={12} /></> : null}</span>
                <b className="tot">{formatINR(o.total)}</b>
              </button>
              {open === o.id && <OrderEditor order={o} onSaved={(n) => setList((l) => (l ?? []).map((x) => (x.id === n.id ? { ...x, ...n } : x)))} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** update 84: the prescription on an order: open it, approve it, or ask for a clearer one. */
function RxAdmin({ order, onSaved }: { order: AdminOrder; onSaved: (o: AdminOrder) => void }) {
  const [note, setNote] = useState(order.rx?.note ?? ""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const rx = order.rx!;
  const open = async () => { const r = await fetch(`/api/store/admin/orders/${order.id}/rx`, { credentials: "same-origin" }); if (!r.ok) { setMsg("Couldn't open it."); return; } const u = URL.createObjectURL(await r.blob()); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 60000); };
  const decide = async (decision: "approved" | "rejected") => {
    setBusy(true); setMsg("");
    try { const r = await admin<{ order: AdminOrder; emailed: boolean }>(`orders/${order.id}/rx`, { method: "POST", json: { decision, note } }); onSaved(r.order); setMsg(decision === "approved" ? "Approved: it can ship." : r.emailed ? "Rejected; the customer was emailed to send a clearer one." : "Rejected."); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className={`note ax-rx-adm s-${rx.status}`} data-admin="rx">
      <b>Prescription: {rx.status === "approved" ? "approved" : rx.status === "rejected" ? "rejected, waiting for a new one" : "to check before shipping"}</b>
      <div className="row"><button type="button" className="ax-btn" onClick={() => void open()} data-admin="rx-open">Open it</button>
        {rx.status !== "approved" && <button type="button" className="ax-btn teal" disabled={busy} onClick={() => void decide("approved")} data-admin="rx-approve">Approve</button>}
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's wrong (for a rejection)" maxLength={300} data-admin="rx-note" />
        {rx.status !== "rejected" && <button type="button" className="ax-btn danger" disabled={busy || note.trim().length < 3} onClick={() => void decide("rejected")} data-admin="rx-reject">Reject</button>}
      </div>
      <small>Check the doctor's name, registration number, signature and date, and that it covers these items.</small>
      {msg && <small role="status">{msg}</small>}
    </div>
  );
}

function OrderEditor({ order, onSaved }: { order: AdminOrder; onSaved: (o: AdminOrder) => void }) {
  const [courier, setCourier] = useState(order.tracking?.courier ?? "");
  const [number, setNumber] = useState(order.tracking?.number ?? "");
  const [url, setUrl] = useState(order.tracking?.url ?? "");
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState(order.adminNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [refundAmt, setRefundAmt] = useState("");
  const [refundWhy, setRefundWhy] = useState("");
  const [bankRef, setBankRef] = useState("");
  const a = order.address;
  const bankDue = order.payment === "bank" && order.status === "pending";
  const paid = paidOnline(order);
  const refundLeft = Math.round((order.total - (order.refund?.amount ?? 0)) * 100) / 100;

  const save = async (status?: OrderStatus) => {
    if (status === "cancelled" && !window.confirm(paid && refundLeft > 0
      ? `Cancel order ${order.id}? ${formatINR(refundLeft)} paid online is refunded to the customer through Razorpay, and they're told by email.`
      : `Cancel order ${order.id}?${order.status === "pending" && order.payment !== "bank" ? "" : " The customer is told by email."}`)) return;
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ order: AdminOrder; emailed?: boolean; refundError?: string }>(`orders/${order.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), note: note.trim() || undefined, adminNote, tracking: { courier, number, url } } });
      onSaved({ ...order, ...r.order });
      setNote("");
      setMsg(r.refundError ? (order.payment === "bank" ? `Cancelled. ${r.refundError}` : `Cancelled, but the refund didn't go through: ${r.refundError} Refund it below or in Razorpay.`)
        : status ? `Marked ${STATUS_LABEL[status].toLowerCase()}${order.status === "pending" ? "" : r.emailed ? "; the customer was emailed" : a.email ? "; the email didn't go out" : " (no email on this order: call or message the customer)"}.` : "Saved.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  /** The bank transfer has reached the account: the order is placed and the customer told. */
  const markPaid = async () => {
    if (!window.confirm(`Has ${formatINR(order.total)} for ${order.id} reached the store's account? The order is placed and the customer told by email.`)) return;
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ order: AdminOrder; emailed: boolean }>(`orders/${order.id}/paid`, { method: "POST", json: { reference: bankRef.trim() || undefined } });
      onSaved({ ...order, ...r.order });
      setMsg(`Marked paid and placed${r.emailed ? "; the customer was emailed" : ""}. Confirm it when you're ready to pack.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const refund = async () => {
    const amount = refundAmt.trim() ? Number(refundAmt) : refundLeft;
    if (!Number.isFinite(amount) || amount < 1 || amount > refundLeft) { setMsg(`Refund from ₹1 up to ${formatINR(refundLeft)}.`); return; }
    if (!window.confirm(`Refund ${formatINR(amount)} of order ${order.id} through Razorpay? The customer is told by email.`)) return;
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ order: AdminOrder; refunded: number; emailed: boolean }>(`orders/${order.id}/refund`, { method: "POST", json: { amount, reason: refundWhy.trim() || undefined } });
      onSaved({ ...order, ...r.order });
      setRefundAmt(""); setRefundWhy("");
      setMsg(`Refunded ${formatINR(r.refunded)}${r.emailed ? "; the customer was emailed" : ""}. It reaches them in 5 to 7 business days.`);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ax-adm-order">
      <div className="cols">
        <div>
          <h3>Deliver to</h3>
          <p><b>{a.name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? `, near ${a.landmark}` : ""}<br />{a.city}, {a.state} {a.pincode}</p>
          <p><a href={`tel:+91${a.phone}`}>+91 {a.phone}</a>{a.email ? <> · <a href={`mailto:${a.email}`}>{a.email}</a></> : null}</p>
          {order.notes && <p className="note">Customer note: {order.notes}</p>}
          {order.gift && <p className="note gift"><Gift size={13} /> <b>Gift: pack it without prices.</b>{order.gift.message ? <> Message: &ldquo;{order.gift.message}&rdquo;</> : null}{order.gift.from ? <> From {order.gift.from}</> : null}{order.gift.toEmail ? <> · Recipient emailed at {order.gift.toEmail} when it ships</> : null} <button type="button" className="ax-link" onClick={() => printGiftSlip(order)} data-admin="gift-slip">Print the gift slip</button></p>}
          {order.rx && <RxAdmin order={order} onSaved={onSaved} />}
          {order.business && <p className="note"><Building2 size={13} /> For <b>{order.business.name}</b>{order.business.gstin ? <> · GSTIN {order.business.gstin}</> : null}</p>}
        </div>
        <div>
          <h3>Items</h3>
          <ul className="items">
            {order.lines.map((l) => <li key={`${l.productId}:${l.variantId ?? ""}`}><Link href={itemHref(l.productId, l.slug)}>{l.name}</Link>{l.variantLabel ? ` (${l.variantLabel})` : ""} × {l.qty} <b>{formatINR(l.lineTotal)}</b></li>)}
          </ul>
          {!!order.discount && <p>Coupon {order.coupon}: − {formatINR(order.discount)}</p>}
          {!!order.credit && <p>Store credit: − {formatINR(order.credit)}{order.total <= 0 ? <b className="paid"> · Fully paid with credit: don't collect cash</b> : null}</p>}
          <p>Delivery {order.delivery ? formatINR(order.delivery) : "free"} · {order.payment === "cod"
            ? <b>Collect {formatINR(order.total)} cash</b>
            : paid ? <b className="paid">Paid online {formatINR(order.total)}: don't collect cash</b>
              : order.payment === "bank" ? (order.paymentStatus === "paid"
                ? <b className="paid">Paid by bank transfer {formatINR(order.total)}: don't collect cash</b>
                : <b className="due">Bank transfer of {formatINR(order.total)} not received yet</b>)
                : <b className="due">Online payment of {formatINR(order.total)} not received</b>}</p>
          {order.payment === "bank" && order.paymentStatus === "paid" && (
            <p className="muted"><Building2 size={13} /> Received {order.paidAt ? when(order.paidAt) : ""}{order.bankRef ? ` · reference ${order.bankRef}` : ""}</p>
          )}
          {order.payment === "online" && (
            <p className="muted"><CreditCard size={13} /> {paid ? `Paid ${order.paidAt ? when(order.paidAt) : ""}` : "Not paid"}{order.paymentId ? ` · Razorpay ${order.paymentId}` : ""}{order.refund ? ` · refunded ${formatINR(order.refund.amount)} (${order.refund.status})` : ""}</p>
          )}
        </div>
        <div>
          <h3>History</h3>
          <ul className="hist">{order.history.map((h, i) => <li key={i}><b>{STATUS_LABEL[h.status]}</b> {when(h.at)}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
        </div>
      </div>
      {bankDue && (
        <div className="ax-adm-bank">
          <h3><Building2 size={15} /> Waiting for a bank transfer of {formatINR(order.total)}</h3>
          <p className="muted">Look for {order.id} as the reference in the account. Unpaid after 3 days, it&apos;s cancelled on its own.</p>
          <div className="ax-form"><label className="f"><span>Transfer reference (UTR) <em>(optional)</em></span><input value={bankRef} onChange={(e) => setBankRef(e.target.value)} maxLength={40} /></label></div>
          <button type="button" className="ax-btn teal" disabled={busy} onClick={markPaid}><Check size={15} /> Mark paid</button>
        </div>
      )}
      <div className="ax-form">
        <label className="f"><span>Courier</span><input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Delhivery, Blue Dart, India Post…" /></label>
        <label className="f"><span>Tracking number</span><input value={number} onChange={(e) => setNumber(e.target.value)} /></label>
        <label className="f wide"><span>Tracking link <em>(https)</em></span><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
        <label className="f wide"><span>Message to the customer with the next status <em>(optional)</em></span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></label>
        <label className="f wide"><span>Team note <em>(only you see this)</em></span><textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} maxLength={1000} /></label>
      </div>
      <div className="acts">
        {(NEXT[order.status] ?? []).map((s) => (
          <button key={s} type="button" className={`ax-btn${s === "cancelled" ? " danger" : " teal"}`} disabled={busy} onClick={() => save(s)}>
            {s === "shipped" ? <Truck size={15} /> : s === "cancelled" ? null : <Check size={15} />} Mark {STATUS_LABEL[s].toLowerCase()}
          </button>
        ))}
        <button type="button" className="ax-btn" disabled={busy} onClick={() => save()}>Save details</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {paid && refundLeft > 0 && (
        <div className="ax-adm-refund">
          <h3><RotateCcw size={15} /> Refund through Razorpay</h3>
          <div className="ax-form">
            <label className="f"><span>Amount (₹)</span><input value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} inputMode="decimal" placeholder={`${refundLeft} (all that's left)`} /></label>
            <label className="f wide"><span>Reason, for the customer's email <em>(optional)</em></span><input value={refundWhy} onChange={(e) => setRefundWhy(e.target.value)} maxLength={200} placeholder="For example, one item arrived damaged" /></label>
          </div>
          <button type="button" className="ax-btn" disabled={busy} onClick={refund}><RotateCcw size={15} /> Refund {refundAmt.trim() && Number(refundAmt) > 0 ? formatINR(Number(refundAmt)) : formatINR(refundLeft)}</button>
        </div>
      )}
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ requests */

function Requests() {
  const [list, setList] = useState<Enquiry[] | null>(null);
  const [status, setStatus] = useState("new");
  const [err, setErr] = useState("");
  const load = useCallback(() => { admin<{ enquiries: Enquiry[] }>(`enquiries${status ? `?status=${status}` : ""}`).then((r) => setList(r.enquiries)).catch((e) => setErr(e.message)); }, [status]);
  useEffect(() => { setList(null); load(); }, [load]);
  const mark = async (e: Enquiry, s: string) => {
    try { await admin(`enquiries/${e.id}`, { method: "PATCH", json: { status: s, note: e.note ?? "" } }); setList((l) => (l ?? []).filter((x) => x.id !== e.id || !status).map((x) => (x.id === e.id ? { ...x, status: s } : x))); }
    catch (x) { setErr((x as Error).message); }
  };
  return (
    <div>
      <div className="ax-adm-bar">
        <div className="seg">{[["new", "New"], ["contacted", "Contacted"], ["closed", "Closed"], ["", "All"]].map(([k, l]) => <button key={k} type="button" className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{l}</button>)}</div>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">Nothing here.</p> : (
        <ul className="ax-adm-req">
          {list.map((e) => (
            <li key={e.id}>
              <div className="h"><span className={`kind k-${e.kind}`}>{e.kind === "callback" ? <><PhoneCall size={11} /> Call back</> : ({ price: "Price", book: "Book", bulk: "Bulk", general: "Question" } as Record<string, string>)[e.kind] ?? e.kind}</span><b>{e.item || (e.kind === "callback" ? "Call to take an order" : "General question")}</b>{e.kind !== "general" && <span>× {e.qty}</span>}<span className="muted">{when(e.created_at)}</span></div>
              <p>{e.name} · <a href={`tel:+91${e.phone}`}>+91 {e.phone}</a>{e.email ? <> · <a href={`mailto:${e.email}`}>{e.email}</a></> : null}{e.city ? ` · ${e.city}` : ""}</p>
              {e.message && <p className="msg">{e.message}</p>}
              <div className="acts">
                {e.product && <Link href={itemHref(e.product.id, e.product.slug)} className="ax-link">{isBookId(e.product.id) ? "Book page" : "Product page"} <ExternalLink size={12} /></Link>}
                {e.status !== "contacted" && <button type="button" className="ax-btn" onClick={() => mark(e, "contacted")}>Mark contacted</button>}
                {e.status !== "closed" && <button type="button" className="ax-btn" onClick={() => mark(e, "closed")}>Close</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ bulk requests (hospitals and medical colleges) */

function Bulk() {
  const [list, setList] = useState<AdminBulk[] | null>(null);
  const [status, setStatus] = useState<string>("new");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => { setErr(""); admin<{ requests: AdminBulk[] }>(`bulk${status ? `?status=${status}` : ""}`).then((r) => setList(r.requests)).catch((e) => setErr(e.message)); }, [status]);
  useEffect(() => { setList(null); load(); }, [load]);
  return (
    <div>
      <div className="ax-adm-bar">
        <div className="seg">{[...BULK_STATUSES.map((k) => [k, BULK_STATUS_LABEL[k]]), ["", "All"]].map(([k, l]) => <button key={k} type="button" className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{l}</button>)}</div>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">No bulk requests here. They come from aethex.in/hospitals and aethex.in/medical-colleges.</p> : (
        <ul className="ax-adm-list">
          {list.map((r) => (
            <li key={r.id} className={open === r.id ? "open" : ""}>
              <button type="button" className="row" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <b>{r.id}</b>
                <span>{r.institution} · {r.city}</span>
                <span className="muted">{when(r.createdAt)}</span>
                <span className={`ax-ov-status b-${r.status}`}>{BULK_STATUS_LABEL[r.status]}{r.schedule ? ` · ${everyText(r.schedule.every)}` : ""}</span>
                <b className="tot">{r.units ? `${r.units.toLocaleString("en-IN")} units` : "See notes"}</b>
              </button>
              {open === r.id && <BulkEditor req={r} onSaved={(n) => setList((l) => (l ?? []).map((x) => (x.id === n.id ? n : x)).filter((x) => !status || x.status === status || x.id === n.id))} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BulkEditor({ req, onSaved }: { req: AdminBulk; onSaved: (r: AdminBulk) => void }) {
  const { data: store } = useStore(true, { books: req.items.some((i) => isBookId(i.productId)) });
  const [note, setNote] = useState(req.adminNote);
  const [toThem, setToThem] = useState(req.customerNote ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const brand = (slug: string) => store?.brandName(slug) ?? slug;
  const asText = () => [
    `${req.institution} (${req.instType}), ${req.city}, ${req.state} ${req.pincode}`,
    ...req.items.map((i) => `${i.qty} x ${isBookId(i.productId) ? `${i.name}, ${brand(i.brand)}` : `${brand(i.brand)} ${i.name}`}${i.variantLabel ? ` (${i.variantLabel})` : ""}${i.unitPrice === null ? " [price on request]" : ` [store price ${i.unitPrice}]`}`),
    req.schedule ? `Repeat delivery: ${scheduleText(req.schedule)}${req.needBy ? `, the first by ${formatDay(req.needBy)}` : ""}` : req.needBy ? `Needed by ${formatDay(req.needBy)}` : "",
    req.notes ? `Notes: ${req.notes}` : "",
  ].filter(Boolean).join("\n");
  const copy = async () => { try { await navigator.clipboard.writeText(asText()); setMsg("The list is copied."); } catch { setMsg("Couldn't copy: select the items and copy them instead."); } };
  const save = async (status?: BulkStatus) => {
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ request: AdminBulk }>(`bulk/${req.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), adminNote: note, customerNote: toThem } });
      onSaved(r.request);
      setMsg(status ? `Marked ${BULK_STATUS_LABEL[status].toLowerCase()}.` : "Saved.");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const subject = encodeURIComponent(`Quotation ${req.id} for ${req.institution}`);
  return (
    <div className="ax-adm-order">
      <div className="cols">
        <div>
          <h3>{req.segment === "hospital" ? "Hospital" : "Medical college"}</h3>
          <p><b>{req.institution}</b> · {req.instType}{req.gstin ? <><br />GSTIN {req.gstin}</> : null}</p>
          <p>{req.contactName}{req.designation ? `, ${req.designation}` : ""}<br /><a href={`tel:+91${req.phone}`}>+91 {req.phone}</a> · <a href={`mailto:${req.email}`}>{req.email}</a></p>
        </div>
        <div>
          <h3>Deliver to</h3>
          <p>{req.address ? <>{req.address}<br /></> : null}{req.city}, {req.state} {req.pincode}{req.needBy ? <><br />{req.schedule ? "First delivery by" : "Needed by"} {formatDay(req.needBy)}</> : null}</p>
          {req.schedule && <p className="note"><b>Repeat delivery:</b> {scheduleText(req.schedule)}</p>}
          {req.notes && <p className="note">Notes: {req.notes}</p>}
        </div>
        <div>
          <h3>Items {req.units ? `· ${req.units.toLocaleString("en-IN")} units` : ""}</h3>
          {req.items.length ? (
            <ul className="items">
              {req.items.map((i) => (
                <li key={`${i.productId}:${i.variantId ?? ""}`}>
                  {i.qty.toLocaleString("en-IN")} × <Link href={itemHref(i.productId, i.slug)}>{isBookId(i.productId) ? `${i.name}, ${brand(i.brand)}` : `${brand(i.brand)} ${i.name}`}</Link>{i.variantLabel ? ` (${i.variantLabel})` : ""}
                  {" "}<span className="muted">{i.unitPrice === null ? "price on request" : `${formatINR(i.unitPrice)} each`}{i.inStock ? "" : " · out of stock"}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted">No products picked: the request is in the notes.</p>}
          {req.estTotal > 0 && <p>At store prices: <b>{formatINR(req.estTotal)}</b>{req.unpriced ? ` + ${req.unpriced} on request` : ""}</p>}
        </div>
      </div>
      <div className="ax-form">
        <label className="f wide"><span>Team note <em>(only you see this: quoted amount, follow-ups)</em></span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} /></label>
        <label className="f wide"><span>Note to the {req.segment === "hospital" ? "hospital" : "college"} <em>(shown in their account under Quotation requests)</em></span><textarea value={toThem} onChange={(e) => setToThem(e.target.value)} rows={2} maxLength={1000} placeholder="For example: Quotation sent on 21 Oct, valid for 15 days." /></label>
      </div>
      <div className="acts">
        <a className="ax-btn teal" href={`mailto:${req.email}?subject=${subject}`}><Mail size={15} /> Email the quotation</a>
        <button type="button" className="ax-btn" onClick={copy}><Copy size={15} /> Copy the list</button>
        {(["quoted", "ordered", "closed"] as BulkStatus[]).filter((s) => s !== req.status).map((s) => (
          <button key={s} type="button" className="ax-btn" disabled={busy} onClick={() => save(s)}><Check size={15} /> Mark {BULK_STATUS_LABEL[s].toLowerCase()}</button>
        ))}
        {req.status !== "new" && <button type="button" className="ax-btn" disabled={busy} onClick={() => save("new")}>Back to new</button>}
        <button type="button" className="ax-btn" disabled={busy} onClick={() => save()}>Save notes</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ products */

function Products() {
  const [kind, setKind] = useState<"products" | "books">("products");
  const { data: store, refetch } = useStore();
  const { data: bs, refetch: refetchBooks } = useBooks(kind === "books");
  const [ov, setOv] = useState<Record<string, Override & { updatedAt?: number }>>({});
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [only, setOnly] = useState<"" | "por" | "changed" | "oos">("");
  const [open, setOpen] = useState<number | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { admin<{ overrides: Record<string, Override> }>("overrides").then((r) => setOv(r.overrides)).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { setBrand(""); setOpen(null); }, [kind]);

  const books = kind === "books";
  const bookList = useMemo(() => (bs ? bs.books.map(bookSummary) : []), [bs]);
  const source = books ? bookList : store?.products;
  const makers = books ? bs?.publishers : store?.brands;
  const makerName = (slug: string) => (books ? bs?.publisherName(slug) : store?.brandName(slug)) ?? slug;
  const list = useMemo(() => {
    if (!source) return [];
    const w = q.trim().toLowerCase();
    // Hidden products aren't in the public list: add them back from the overrides.
    return source.filter((p) => (!brand || p.brand === brand) && (!w || `${p.name} ${p.model ?? ""} ${p.id}`.toLowerCase().includes(w))
      && (only !== "por" || p.priceOnRequest) && (only !== "changed" || ov[p.id]) && (only !== "oos" || !p.inStock));
  }, [source, q, brand, only, ov]);
  const hiddenIds = Object.entries(ov).filter(([id, o]) => o.hidden && isBookId(Number(id)) === books).map(([id]) => Number(id));
  const word = books ? "book" : "product";

  const switcher = (
    <div className="seg" role="tablist" aria-label="Products or books">
      <button type="button" role="tab" aria-selected={!books} className={!books ? "on" : ""} onClick={() => setKind("products")}>Products</button>
      <button type="button" role="tab" aria-selected={books} className={books ? "on" : ""} onClick={() => setKind("books")}>Medical books</button>
    </div>
  );
  if (!source || !makers) return <div><div className="ax-adm-bar">{switcher}</div><p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p></div>;
  return (
    <div>
      <div className="ax-adm-bar">
        {switcher}
        <form onSubmit={(e) => e.preventDefault()} className="find"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={books ? "Title, ISBN or number" : "Name, model or number"} /></form>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label={books ? "Publisher" : "Brand"}><option value="">{books ? "All publishers" : "All brands"}</option>{makers.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</select>
        <div className="seg">{([["", "All"], ["por", "Price on request"], ["oos", "Out of stock"], ["changed", "Changed"]] as const).map(([k, l]) => <button key={k} type="button" className={only === k ? "on" : ""} onClick={() => setOnly(k)}>{l}</button>)}</div>
      </div>
      {err && <p className="ax-form-err">{err}</p>}
      {hiddenIds.length > 0 && <p className="fine">{hiddenIds.length} hidden {word}{hiddenIds.length === 1 ? "" : "s"} (numbers {hiddenIds.join(", ")}). Open one by searching its number to show it again.</p>}
      <p className="fine">{list.length.toLocaleString("en-IN")} {word}s{list.length > 200 ? " (the first 200 are shown: search to find others)" : ""}. Prices include taxes. Changes show on the site within a minute.</p>
      <ul className="ax-adm-prods">
        {list.slice(0, 200).map((p) => (
          <li key={p.id} className={open === p.id ? "open" : ""}>
            <button type="button" className="row" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <span className="pic"><ProductImage src={p.image} width={96} book={books} /></span>
              <span className="nm"><b>{p.name}</b><small>#{p.id} · {makerName(p.brand)}{p.variants ? ` · ${p.variants.length} ${(p.optionName ?? "option").toLowerCase()}s` : ""}</small></span>
              <span className="pr">{p.priceOnRequest ? <em>Price on request</em> : <>{p.from ? "from " : ""}{formatINR(Number(p.price))}</>}</span>
              <span className={`st${p.inStock ? "" : " out"}`}>{p.inStock ? "In stock" : "Out of stock"}</span>
              {ov[p.id] && <span className="chg">Changed</span>}
            </button>
            {open === p.id && <ProductEditor p={p} maker={makerName(p.brand)} current={ov[p.id]} onSaved={(o) => { setOv((m) => { const n = { ...m }; if (o) n[p.id] = o; else delete n[p.id]; return n; }); if (books) refetchBooks(); else refetch(); }} />}
          </li>
        ))}
      </ul>
      {/* hidden products can be found by number */}
      {/^\d+$/.test(q.trim()) && hiddenIds.includes(Number(q.trim())) && (
        <div className="ax-adm-hidden"><p>{books ? "Book" : "Product"} #{q.trim()} is hidden.</p><button type="button" className="ax-btn" onClick={async () => { await admin(`overrides/${q.trim()}`, { method: "PUT", json: {} }); setOv((m) => { const n = { ...m }; delete n[q.trim()]; return n; }); if (books) refetchBooks(); else refetch(); }}>Show it again</button></div>
      )}
    </div>
  );
}

/** The store's own price, MRP, stock and country of origin for a product or a book (a book has no country of origin). */
function ProductEditor({ p, maker, current, onSaved }: { p: ProductSummary; maker: string; current?: Override; onSaved: (o: Override | null) => void }) {
  const book = isBookId(p.id);
  const variantsPriced = !!p.variants?.some((v) => v.price !== undefined) && !current?.variants;
  const [price, setPrice] = useState(current?.price != null ? String(current.price) : "");
  const [mrp, setMrp] = useState(current?.mrp != null ? String(current.mrp) : "");
  const [inStock, setInStock] = useState(current?.inStock ?? p.inStock);
  const [coo, setCoo] = useState(current?.countryOfOrigin ?? "");
  const [rx, setRx] = useState(!!current?.rx);
  const [vs, setVs] = useState<Record<string, { price: string; mrp: string; inStock: boolean }>>(() => Object.fromEntries((p.variants ?? []).map((v) => {
    const o = current?.variants?.[v.id];
    return [v.id, { price: o?.price != null ? String(o.price) : "", mrp: o?.mrp != null ? String(o.mrp) : "", inStock: o?.inStock ?? v.inStock }];
  })));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const build = (hidden = false) => {
    const o: Record<string, unknown> = {};
    if (price.trim()) o.price = Number(price);
    if (mrp.trim()) o.mrp = Number(mrp);
    o.inStock = inStock;
    if (coo.trim()) o.countryOfOrigin = coo.trim();
    if (rx) o.rx = true;
    if (hidden) o.hidden = true;
    const vo: Record<string, unknown> = {};
    for (const v of p.variants ?? []) {
      const e = vs[v.id]; if (!e) continue;
      const x: Record<string, unknown> = {};
      if (e.price.trim()) x.price = Number(e.price);
      if (e.mrp.trim()) x.mrp = Number(e.mrp);
      if (e.inStock !== v.inStock || current?.variants?.[v.id]?.inStock !== undefined) x.inStock = e.inStock;
      if (Object.keys(x).length) vo[v.id] = x;
    }
    if (Object.keys(vo).length) o.variants = vo;
    return o;
  };
  const save = async (body: Record<string, unknown>, done: string) => {
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ override: Override }>(`overrides/${p.id}`, { method: "PUT", json: body });
      onSaved(Object.keys(r.override).length ? r.override : null);
      setMsg(done);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="ax-adm-prod">
      {p.offer && <p className="fine"><b>{p.offer.title}</b> is on: the shop shows this {book ? "book" : "product"} {p.offer.percent}% below the prices set here (see Offers).</p>}
      <p className="fine">{p.priceOnRequest
        ? book ? "No price is listed for this book yet: set a selling price and MRP to sell it directly. Leave the price empty to keep it on request." : `${maker} doesn't publish Indian prices: set a selling price and MRP to sell it directly. Leave the price empty to keep it on request.`
        : `Leave a field empty to keep the ${book ? "publisher's" : "brand's"} price.`}{variantsPriced ? " Sizes or colours have their own prices below." : ""} <Link href={itemHref(p.id, p.slug)}>{book ? "Open book page" : "Open product page"}</Link></p>
      <div className="ax-form">
        <label className="f"><span>Selling price (₹)</span><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder={p.priceOnRequest ? "On request" : String(p.price ?? "")} /></label>
        <label className="f"><span>MRP (₹)</span><input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="decimal" placeholder={p.mrp ? String(p.mrp) : ""} /></label>
        {!book && <label className="f"><span>Country of origin</span><input value={coo} onChange={(e) => setCoo(e.target.value)} placeholder="As on the pack" maxLength={60} /></label>}
        <label className="ax-switch f"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /><span className="track"><i /></span><span>In stock</span></label>
        {!book && <label className="ax-switch f"><input type="checkbox" checked={rx} onChange={(e) => setRx(e.target.checked)} data-admin="rx-switch" /><span className="track"><i /></span><span>Needs a prescription</span></label>}
      </div>
      {p.variants && p.variants.length > 0 && (
        <table className="ax-adm-vars">
          <thead><tr><th>{p.optionName ?? "Option"}</th><th>Price (₹)</th><th>MRP (₹)</th><th>In stock</th></tr></thead>
          <tbody>
            {p.variants.map((v) => (
              <tr key={v.id}>
                <td>{v.label}</td>
                <td><input value={vs[v.id]?.price ?? ""} onChange={(e) => setVs((m) => ({ ...m, [v.id]: { ...m[v.id], price: e.target.value } }))} inputMode="decimal" placeholder={v.price != null ? String(v.price) : "—"} /></td>
                <td><input value={vs[v.id]?.mrp ?? ""} onChange={(e) => setVs((m) => ({ ...m, [v.id]: { ...m[v.id], mrp: e.target.value } }))} inputMode="decimal" placeholder={v.mrp != null ? String(v.mrp) : "—"} /></td>
                <td><input type="checkbox" checked={vs[v.id]?.inStock ?? v.inStock} onChange={(e) => setVs((m) => ({ ...m, [v.id]: { ...m[v.id], inStock: e.target.checked } }))} aria-label={`${v.label} in stock`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="acts">
        <button type="button" className="ax-btn teal" disabled={busy} onClick={() => save(build(), "Saved. The site shows it within a minute.")}>Save</button>
        {current && <button type="button" className="ax-btn" disabled={busy} onClick={() => save({}, book ? "Back to the publisher's details." : "Back to the brand's details.")}>Undo all changes</button>}
        <button type="button" className="ax-btn danger" disabled={busy} onClick={() => { if (window.confirm(`Hide ${p.name} from the store?`)) save(build(true), "Hidden from the store."); }}>Hide from store</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ offers and coupons */

type AdminOffer = Offer & { updatedAt: number };
type AdminCoupon = Coupon & { updatedAt: number; uses: { orders: number; discount: number } };

/** India-time "YYYY-MM-DD" for a date input (an end date is stored as the end of its day). */
const dayIn = (ms?: number, end = false) => (ms ? new Date(ms - (end ? 1000 : 0) + 5.5 * 3600_000).toISOString().slice(0, 10) : "");
const dayOut = (ms?: number, end = false) => (ms ? new Date(ms - (end ? 1000 : 0)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");
function promoState(p: { active: boolean; startsAt?: number; endsAt?: number }): [string, string] {
  const now = Date.now();
  if (!p.active) return ["Paused", "off"];
  if (p.endsAt && p.endsAt <= now) return ["Ended", "off"];
  if (p.startsAt && p.startsAt > now) return [`Starts ${dayOut(p.startsAt)}`, "soon"];
  return ["Running", "on"];
}

/** Categories and brands an offer or coupon can cover: the store's, plus all medical books and each publisher. */
function useScopes() {
  const { data: store } = useStore();
  const { data: bs } = useBooks();
  return useMemo(() => ({
    categories: [...(store?.categories ?? []).map((c) => ({ slug: c.slug, name: c.name })), { slug: "books", name: "Medical books (all)" }],
    brands: [...(store?.brands ?? []).map((b) => ({ slug: b.slug, name: b.name })), ...(bs?.publishers ?? []).map((p) => ({ slug: p.slug, name: `${p.name} (books)` }))],
    name: (slug: string) => (slug === "books" ? "Medical books" : store?.category(slug)?.name ?? store?.brand(slug)?.name ?? bs?.publisherName(slug) ?? slug),
  }), [store, bs]);
}

function Picker({ label, all, value, onChange }: { label: string; all: { slug: string; name: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const shown = all.filter((x) => !q.trim() || x.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="ax-adm-pick">
      <div className="h"><b>{label}</b>{value.length > 0 && <span>{value.length} chosen · <button type="button" className="ax-link" onClick={() => onChange([])}>clear</button></span>}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Find a ${label.toLowerCase().replace(/s$/, "")}`} />
      <div className="box">
        {shown.map((x) => (
          <label key={x.slug} className="ax-check"><input type="checkbox" checked={value.includes(x.slug)} onChange={() => onChange(value.includes(x.slug) ? value.filter((v) => v !== x.slug) : [...value, x.slug])} /><span className="box" /> {x.name}</label>
        ))}
      </div>
    </div>
  );
}

function Promos() {
  const scopes = useScopes();
  const [data, setData] = useState<{ coupons: AdminCoupon[]; offers: AdminOffer[] } | null>(null);
  const [err, setErr] = useState("");
  const [offer, setOffer] = useState<AdminOffer | "new" | null>(null);
  const [couponEdit, setCouponEdit] = useState<AdminCoupon | "new" | null>(null);
  const load = useCallback(() => { setErr(""); admin<{ coupons: AdminCoupon[]; offers: AdminOffer[] }>("promos").then(setData).catch((e) => setErr(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (what: "offers" | "coupons", id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? ${what === "offers" ? "Prices go back at once." : "The code stops working at once."}`)) return;
    try { await admin(`${what}/${id}`, { method: "DELETE" }); load(); } catch (e) { setErr((e as Error).message); }
  };
  if (!data) return err ? <p className="ax-form-err">{err}</p> : <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p>;
  const scopeText = (cats?: string[], brands?: string[]) => [...(cats ?? []), ...(brands ?? [])].map(scopes.name).join(", ") || "Everything with a price";
  return (
    <div className="ax-adm-promos">
      {err && <p className="ax-form-err">{err}</p>}
      <section>
        <div className="ax-adm-sec-head">
          <div><h2>Offers</h2><p className="fine">A sale on categories or brands: their prices drop by the percent while it runs, to the whole rupee (MRP stays). Shoppers see the sale on products, in the cart and at checkout. Where two offers cover a product, the bigger one counts.</p></div>
          <button type="button" className="ax-btn teal" onClick={() => setOffer("new")}><BadgePercent size={15} /> New offer</button>
        </div>
        {offer && <OfferEditor offer={offer === "new" ? null : offer} scopes={scopes} onDone={() => { setOffer(null); load(); }} onCancel={() => setOffer(null)} />}
        {data.offers.length === 0 ? <p className="ax-adm-empty">No offers yet.</p> : (
          <ul className="ax-adm-promo">
            {data.offers.map((o) => {
              const [st, cls] = promoState(o);
              return (
                <li key={o.id}>
                  <span className={`chip ${cls}`}>{st}</span>
                  <b>{o.title}</b>
                  <span className="big">{o.percent}% off</span>
                  <span className="muted">{scopeText(o.categories, o.brands)}</span>
                  <span className="muted">{o.startsAt ? `from ${dayOut(o.startsAt)}` : ""}{o.endsAt ? ` till ${dayOut(o.endsAt, true)}` : o.startsAt ? "" : "no end date"}</span>
                  <span className="acts"><button type="button" className="ax-btn" onClick={() => setOffer(o)}>Edit</button><button type="button" className="ax-btn danger" onClick={() => del("offers", o.id, o.title)}>Delete</button></span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section>
        <div className="ax-adm-sec-head">
          <div><h2>Coupon codes</h2><p className="fine">Codes shoppers type in the cart: a percent (with a cap) or an amount off, from a minimum order, for everything or chosen categories and brands. Share them yourself (social media, WhatsApp, emails); they aren't shown on the site.</p></div>
          <button type="button" className="ax-btn teal" onClick={() => setCouponEdit("new")}>New code</button>
        </div>
        {couponEdit && <CouponEditor coupon={couponEdit === "new" ? null : couponEdit} scopes={scopes} onDone={() => { setCouponEdit(null); load(); }} onCancel={() => setCouponEdit(null)} />}
        {data.coupons.length === 0 ? <p className="ax-adm-empty">No coupon codes yet.</p> : (
          <ul className="ax-adm-promo">
            {data.coupons.map((c) => {
              const [st, cls] = promoState(c);
              return (
                <li key={c.code}>
                  <span className={`chip ${cls}`}>{c.limit && c.uses.orders >= c.limit ? "Used up" : st}</span>
                  <b><code>{c.code}</code></b>
                  <span className="big">{couponText(c)}</span>
                  <span className="muted">{scopeText(c.categories, c.brands)}{c.label ? ` · “${c.label}”` : ""}</span>
                  <span className="muted">{c.uses.orders} order{c.uses.orders === 1 ? "" : "s"}{c.uses.discount ? `, ${formatINR(c.uses.discount)} off` : ""}{c.limit ? ` · ${c.limit} in all` : ""}{c.perPhone ? ` · ${c.perPhone} per customer` : ""}{c.endsAt ? ` · till ${dayOut(c.endsAt, true)}` : ""}</span>
                  <span className="acts"><button type="button" className="ax-btn" onClick={() => setCouponEdit(c)}>Edit</button><button type="button" className="ax-btn danger" onClick={() => del("coupons", c.code, c.code)}>Delete</button></span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function OfferEditor({ offer, scopes, onDone, onCancel }: { offer: AdminOffer | null; scopes: ReturnType<typeof useScopes>; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({
    title: offer?.title ?? "", percent: offer ? String(offer.percent) : "10", categories: offer?.categories ?? [], brands: offer?.brands ?? [],
    startsAt: dayIn(offer?.startsAt), endsAt: dayIn(offer?.endsAt, true), active: offer?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setBusy(true); setMsg("");
    try {
      await admin(`offers/${offer?.id ?? "new"}`, { method: "PUT", json: { ...f, percent: Number(f.percent), startsAt: f.startsAt || undefined, endsAt: f.endsAt || undefined } });
      onDone();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="ax-adm-order ax-adm-promo-ed">
      <h3>{offer ? `Edit ${offer.title}` : "New offer"}</h3>
      <div className="ax-form">
        <label className="f"><span>Name shoppers see</span><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={60} placeholder="Diwali sale" /></label>
        <label className="f"><span>Percent off</span><input value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} inputMode="numeric" /></label>
        <label className="f"><span>From <em>(optional)</em></span><input type="date" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></label>
        <label className="f"><span>Until the end of <em>(optional)</em></span><input type="date" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
        <label className="ax-switch f"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span className="track"><i /></span><span>On</span></label>
      </div>
      <div className="ax-adm-picks">
        <Picker label="Categories" all={scopes.categories} value={f.categories} onChange={(v) => setF({ ...f, categories: v })} />
        <Picker label="Brands" all={scopes.brands} value={f.brands} onChange={(v) => setF({ ...f, brands: v })} />
      </div>
      <div className="acts">
        <button type="button" className="ax-btn teal" disabled={busy} onClick={save}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save offer</button>
        <button type="button" className="ax-btn" onClick={onCancel}>Cancel</button>
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

function CouponEditor({ coupon, scopes, onDone, onCancel }: { coupon: AdminCoupon | null; scopes: ReturnType<typeof useScopes>; onDone: () => void; onCancel: () => void }) {
  const num = (n?: number) => (n === undefined ? "" : String(n));
  const [f, setF] = useState({
    code: coupon?.code ?? "", kind: coupon?.kind ?? "percent", value: coupon ? String(coupon.value) : "10", maxDiscount: num(coupon?.maxDiscount), minOrder: num(coupon?.minOrder ?? 0),
    startsAt: dayIn(coupon?.startsAt), endsAt: dayIn(coupon?.endsAt, true), limit: num(coupon?.limit), perPhone: num(coupon?.perPhone), label: coupon?.label ?? "",
    categories: coupon?.categories ?? [], brands: coupon?.brands ?? [], active: coupon?.active ?? true, public: coupon?.public ?? false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [scoped, setScoped] = useState(!!(coupon?.categories?.length || coupon?.brands?.length));
  const save = async () => {
    const code = f.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 3) { setMsg("A code is 3 to 20 letters and digits, like DIWALI10."); return; }
    setBusy(true); setMsg("");
    try {
      await admin(`coupons/${code}`, { method: "PUT", json: {
        kind: f.kind, value: Number(f.value), minOrder: f.minOrder ? Number(f.minOrder) : 0, maxDiscount: f.kind === "percent" && f.maxDiscount ? Number(f.maxDiscount) : undefined,
        startsAt: f.startsAt || undefined, endsAt: f.endsAt || undefined, limit: f.limit ? Number(f.limit) : undefined, perPhone: f.perPhone ? Number(f.perPhone) : undefined,
        label: f.label.trim() || undefined, categories: scoped ? f.categories : [], brands: scoped ? f.brands : [], active: f.active, public: f.public,
      } });
      onDone();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="ax-adm-order ax-adm-promo-ed">
      <h3>{coupon ? `Edit ${coupon.code}` : "New coupon code"}</h3>
      <div className="ax-form">
        <label className="f"><span>Code</span><input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} disabled={!!coupon} maxLength={20} placeholder="WELCOME10" /></label>
        <label className="f"><span>Discount</span>
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "percent" | "amount" })}><option value="percent">Percent off</option><option value="amount">Amount off (₹)</option></select>
        </label>
        <label className="f"><span>{f.kind === "percent" ? "Percent" : "Amount (₹)"}</span><input value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} inputMode="numeric" /></label>
        {f.kind === "percent" && <label className="f"><span>At most (₹) <em>(optional)</em></span><input value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} inputMode="numeric" /></label>}
        <label className="f"><span>Minimum order (₹)</span><input value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} inputMode="numeric" /></label>
        <label className="f"><span>Orders in all <em>(optional)</em></span><input value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} inputMode="numeric" placeholder="No limit" /></label>
        <label className="f"><span>Per mobile number <em>(optional)</em></span><input value={f.perPhone} onChange={(e) => setF({ ...f, perPhone: e.target.value })} inputMode="numeric" placeholder="No limit" /></label>
        <label className="f"><span>From <em>(optional)</em></span><input type="date" value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></label>
        <label className="f"><span>Until the end of <em>(optional)</em></span><input type="date" value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></label>
        <label className="f"><span>Name shoppers see <em>(optional)</em></span><input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} maxLength={60} placeholder="Welcome offer" /></label>
        <label className="ax-switch f"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span className="track"><i /></span><span>On</span></label>
        <label className="ax-switch f"><input type="checkbox" checked={f.public} onChange={(e) => setF({ ...f, public: e.target.checked })} data-admin="coupon-public" /><span className="track"><i /></span><span>Show on the offers page</span></label>
        <label className="ax-switch f"><input type="checkbox" checked={scoped} onChange={(e) => setScoped(e.target.checked)} /><span className="track"><i /></span><span>Only some categories or brands</span></label>
      </div>
      {scoped && (
        <div className="ax-adm-picks">
          <Picker label="Categories" all={scopes.categories} value={f.categories} onChange={(v) => setF({ ...f, categories: v })} />
          <Picker label="Brands" all={scopes.brands} value={f.brands} onChange={(v) => setF({ ...f, brands: v })} />
        </div>
      )}
      <div className="acts">
        <button type="button" className="ax-btn teal" disabled={busy} onClick={save}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save code</button>
        <button type="button" className="ax-btn" onClick={onCancel}>Cancel</button>
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ reviews */

type AdminReview = Review & { status: ReviewStatus; orderId: string; updatedAt: number; product: { id: number; slug: string; name: string; href: string } | null };

function Reviews() {
  const [status, setStatus] = useState<string>("pending");
  const [list, setList] = useState<AdminReview[] | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { setErr(""); admin<{ reviews: AdminReview[] }>(`reviews${status ? `?status=${status}` : ""}`).then((r) => setList(r.reviews)).catch((e) => setErr(e.message)); }, [status]);
  useEffect(() => { setList(null); load(); }, [load]);
  return (
    <div>
      <div className="ax-adm-bar">
        <div className="seg">{[["pending", "To check"], ["approved", "Live"], ["rejected", "Not published"], ["", "All"]].map(([k, l]) => <button key={k} type="button" className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{l}</button>)}</div>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      <p className="fine">Only buyers of delivered orders can review. A review shows on the product once you approve it; a changed review comes back here.</p>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">{status === "pending" ? "No reviews to check." : "Nothing here."}</p> : (
        <ul className="ax-adm-req ax-adm-rv">
          {list.map((r) => <ReviewEditor key={r.id} r={r} onSaved={(n) => setList((l) => (l ?? []).map((x) => (x.id === n.id ? { ...x, ...n } : x)).filter((x) => !status || x.status === status || x.id === n.id))} />)}
        </ul>
      )}
    </div>
  );
}

function ReviewEditor({ r, onSaved }: { r: AdminReview; onSaved: (r: AdminReview) => void }) {
  const [reply, setReply] = useState(r.reply ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async (status?: ReviewStatus) => {
    setBusy(true); setMsg("");
    try {
      const x = await admin<{ review: AdminReview }>(`reviews/${r.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), reply } });
      onSaved({ ...r, ...x.review });
      setMsg(status === "approved" ? "Approved: it's on the product page." : status === "rejected" ? "Not published." : "Reply saved.");
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <li>
      <div className="h">
        <span className={`kind k-${r.status === "approved" ? "bulk" : r.status === "rejected" ? "general" : "price"}`}>{r.status === "approved" ? "Live" : r.status === "rejected" ? "Not published" : "To check"}</span>
        <Stars value={r.rating} size={15} />
        {r.product ? <Link href={r.product.href}><b>{r.product.name}</b></Link> : <b>Item {r.productId}</b>}
        <span className="muted">{when(r.createdAt)} · order {r.orderId}</span>
      </div>
      {r.title && <p><b>{r.title}</b></p>}
      <p className="msg">{r.body}</p>
      <p className="muted">{r.name}{r.city ? `, ${r.city}` : ""}</p>
      <label className="f wide"><span>Public reply <em>(optional, shown under the review)</em></span><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={1000} /></label>
      <div className="acts">
        {r.status !== "approved" && <button type="button" className="ax-btn teal" disabled={busy} onClick={() => save("approved")}><Check size={15} /> Approve</button>}
        {r.status !== "rejected" && <button type="button" className="ax-btn danger" disabled={busy} onClick={() => save("rejected")}>Don't publish</button>}
        <button type="button" className="ax-btn" disabled={busy} onClick={() => save()}>Save reply</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </li>
  );
}

/* ------------------------------------------------------------------ update 76: questions and tax */

type AdminQuestion = ProductQuestion & { status: string; email: string | null; product: { id: number; name: string; href: string } | null };
function Questions() {
  const [status, setStatus] = useState<string>("pending");
  const [list, setList] = useState<AdminQuestion[] | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { setErr(""); admin<{ questions: AdminQuestion[] }>(`questions${status ? `?status=${status}` : ""}`).then((r) => setList(r.questions)).catch((e) => setErr(e.message)); }, [status]);
  useEffect(() => { setList(null); load(); }, [load]);
  return (
    <div data-admin="questions">
      <div className="ax-adm-bar">
        <div className="seg">{[["pending", "To answer"], ["answered", "Answered"], ["hidden", "Hidden"], ["", "All"]].map(([k, l]) => <button key={k} type="button" className={status === k ? "on" : ""} onClick={() => setStatus(k)}>{l}</button>)}</div>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      <p className="fine">Signed-in customers ask about a product. Your answer shows on the product page under Questions and answers, and the customer gets an email.</p>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">{status === "pending" ? "No questions to answer." : "Nothing here."}</p> : (
        <ul className="ax-adm-req ax-adm-rv">{list.map((q) => <QuestionEditor key={q.id} q={q} onSaved={(n) => setList((l) => (l ?? []).map((x) => (x.id === n.id ? { ...x, ...n } : x)))} />)}</ul>
      )}
    </div>
  );
}
function QuestionEditor({ q, onSaved }: { q: AdminQuestion; onSaved: (q: AdminQuestion) => void }) {
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const save = async (status?: string) => {
    setBusy(true); setMsg("");
    try {
      const x = await admin<{ question: AdminQuestion }>(`questions/${q.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), answer } });
      onSaved({ ...q, ...x.question });
      setMsg(x.question.status === "answered" ? "Answered: it's on the product page." : x.question.status === "hidden" ? "Hidden." : "Saved.");
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <li data-q={q.id}>
      <div className="h">
        <span className={`kind k-${q.status === "answered" ? "bulk" : q.status === "hidden" ? "general" : "price"}`}>{q.status === "answered" ? "Answered" : q.status === "hidden" ? "Hidden" : "To answer"}</span>
        {q.product ? <Link href={q.product.href}><b>{q.product.name}</b></Link> : <b>Item {q.productId}</b>}
        <span className="muted">{when(q.at)} · {q.name}{q.email ? ` · ${q.email}` : ""}</span>
      </div>
      <p className="msg">{q.question}</p>
      <label className="f wide"><span>Answer (shown on the product page)</span><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} maxLength={1500} /></label>
      <div className="acts">
        <button type="button" className="ax-btn teal" disabled={busy || !answer.trim()} onClick={() => save("answered")}><Check size={15} /> {q.status === "answered" ? "Update answer" : "Publish answer"}</button>
        {q.status !== "hidden" && <button type="button" className="ax-btn danger" disabled={busy} onClick={() => save("hidden")}>Hide</button>}
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </li>
  );
}

function TaxRates() {
  const { data: store } = useStore(true);
  const [table, setTable] = useState<TaxTable | null>(null);
  const [edit, setEdit] = useState<Record<string, { hsn: string; rate: string }>>({});
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  useEffect(() => { storeFetch<TaxTable>("/tax").then((t) => { setTable(t); setEdit(Object.fromEntries(Object.entries(t.rates).map(([k, v]) => [k, { hsn: v.hsn, rate: String(v.rate) }]))); }).catch((e) => setMsg(e.message)); }, []);
  const cats = useMemo(() => [...(store?.categories ?? []).map((c) => ({ slug: c.slug, name: c.name })), { slug: "books", name: "Medical books" }], [store]);
  const save = async () => {
    setBusy(true); setMsg("");
    try {
      const rates = cats.map((c) => ({ category: c.slug, hsn: edit[c.slug]?.hsn ?? "", rate: edit[c.slug]?.rate ?? "" }));
      const t = await admin<TaxTable>("tax", { json: { rates } });
      setTable(t); setMsg("Saved.");
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const missing = cats.filter((c) => !table?.rates[c.slug]).length;
  return (
    <div className="ax-adm-tax" data-admin="tax">
      <p className="fine">Invoices become GST tax invoices once the store's GSTIN is in src/config/business.ts{BUSINESS.gstin ? ` (it is: ${BUSINESS.gstin})` : table?.sellerGstin ? ` (or the STORE_GSTIN setting: ${table.sellerGstin})` : " (it isn't yet; you can also set STORE_GSTIN)"} and every category in an order has an HSN code and GST rate here. Until then customers get an order receipt. Check each code and rate with your accountant.</p>
      {table && <p className="fine">{missing ? `${missing} categor${missing === 1 ? "y has" : "ies have"} no rate yet.` : "Every category has a rate."}</p>}
      <table className="ax-adm-table">
        <thead><tr><th>Category</th><th>HSN code</th><th>GST %</th></tr></thead>
        <tbody>{cats.map((c) => (
          <tr key={c.slug}>
            <td>{c.name}</td>
            <td><input value={edit[c.slug]?.hsn ?? ""} onChange={(e) => setEdit({ ...edit, [c.slug]: { hsn: e.target.value, rate: edit[c.slug]?.rate ?? "" } })} inputMode="numeric" maxLength={8} aria-label={`HSN code for ${c.name}`} /></td>
            <td><select value={edit[c.slug]?.rate ?? ""} onChange={(e) => setEdit({ ...edit, [c.slug]: { hsn: edit[c.slug]?.hsn ?? "", rate: e.target.value } })} aria-label={`GST rate for ${c.name}`}><option value="">Not set</option>{[0, 0.25, 3, 5, 12, 18, 28, 40].map((r) => <option key={r} value={r}>{r}%</option>)}</select></td>
          </tr>
        ))}</tbody>
      </table>
      <div className="acts"><button type="button" className="ax-btn teal" disabled={busy} onClick={save}>{busy ? <Loader2 size={16} className="spin" /> : <Check size={15} />} Save rates</button>{msg && <span className="ax-adm-msg">{msg}</span>}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ update 80: replacement requests */

type AdminRep = Replacement & { email: string | null; customer: { name: string; phone: string; city: string } | null; product: { name: string; href: string } | null };
const REP_STATUSES: [string, string][] = [["requested", "New"], ["approved", "Approved"], ["picked-up", "Picked up"], ["replaced", "Replaced"], ["refunded", "Refunded"], ["rejected", "Not accepted"]];
function Replacements() {
  const [status, setStatus] = useState<string>("requested");
  const [list, setList] = useState<AdminRep[] | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { setErr(""); admin<{ replacements: AdminRep[] }>(`replacements${status ? `?status=${status}` : ""}`).then((r) => setList(r.replacements)).catch((e) => setErr(e.message)); }, [status]);
  useEffect(() => { setList(null); load(); }, [load]);
  return (
    <div data-admin="replacements">
      <div className="ax-adm-bar">
        <div className="seg">{[...REP_STATUSES, ["", "All"]].map(([k, l]) => <button key={k} type="button" className={status === k ? "on" : ""} onClick={() => setStatus(k!)}>{l}</button>)}</div>
        <button type="button" className="ax-btn" onClick={load}><RefreshCw size={15} /></button>
      </div>
      <p className="fine">Customers report a damaged, defective, wrong or missing item from a delivered order. Each status change emails them, with your note. Refund online payments from the order itself.</p>
      {err && <p className="ax-form-err">{err}</p>}
      {!list ? <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p> : list.length === 0 ? <p className="ax-adm-empty">Nothing here.</p> : (
        <ul className="ax-adm-req">{list.map((r) => <RepEditor key={r.id} r={r} onSaved={(n) => setList((l) => (l ?? []).map((x) => (x.id === n.id ? { ...x, ...n } : x)))} />)}</ul>
      )}
    </div>
  );
}
function RepEditor({ r, onSaved }: { r: AdminRep; onSaved: (r: AdminRep) => void }) {
  const [st, setSt] = useState(r.status), [note, setNote] = useState(r.note ?? ""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const save = async () => {
    setBusy(true); setMsg("");
    try { const x = await admin<{ replacement: Replacement }>(`replacements/${r.id}`, { method: "PATCH", json: { status: st, note } }); onSaved({ ...r, ...x.replacement }); setMsg("Saved. The customer has been emailed."); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <li data-rep={r.id}>
      <div className="h"><span className="kind k-price">{r.reasonText}</span>{r.product ? <Link href={r.product.href}><b>{r.product.name}</b></Link> : <b>Item {r.productId}</b>}<span className="muted">× {r.qty} · order {r.orderId} · {when(r.at)}</span></div>
      <p className="msg">{r.details}</p>
      {r.customer && <p className="muted">{r.customer.name} · {r.customer.phone} · {r.customer.city}{r.email ? ` · ${r.email}` : ""}</p>}
      <div className="ax-form">
        <label className="f"><span>Status</span><select value={st} onChange={(e) => setSt(e.target.value)}>{REP_STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="f wide"><span>Note to the customer <em>(optional)</em></span><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} placeholder="For example: the courier will pick it up on Monday." /></label>
      </div>
      <div className="acts"><button type="button" className="ax-btn teal" disabled={busy} onClick={() => void save()}>{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} Save</button></div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </li>
  );
}
