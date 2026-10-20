/**
 * The store admin (/admin), for the accounts in ADMIN_EMAILS: orders (confirm,
 * ship with tracking, deliver, cancel; download as CSV), price and book
 * requests, bulk quotation requests from hospitals and medical colleges, and
 * products (set prices for price-on-request brands, MRP, stock, country of
 * origin, hide). Talks to /api/store/admin/* (worker/store.ts).
 * Styles: src/shop.css (.ax-adm).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, Building2, Check, ClipboardList, Copy, Download, ExternalLink, Inbox, Loader2, LogIn, Mail, Package, RefreshCw, Search, ShieldCheck, Store, Truck,
} from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { storeFetch, StoreError, useStore, type StoreData } from "@/lib/store/api";
import type { BulkRequest, BulkStatus, Order, OrderStatus, Override, ProductSummary } from "@/lib/store/types";
import { BULK_STATUS_LABEL, BULK_STATUSES, everyText, formatDay, ORDER_STATUSES, scheduleText, STATUS_LABEL } from "@/lib/store/rules";
import { ProductImage } from "@/components/store/ProductImage";
import { when } from "@/components/store/OrderView";
import { loginUrl } from "@/lib/host";
import { formatINR } from "@/lib/utils";

type AdminOrder = Order & { adminNote: string; updatedAt: number; userId: string | null };
type AdminBulk = BulkRequest & { adminNote: string; updatedAt: number };
type Enquiry = { id: string; created_at: number; kind: string; item: string | null; name: string; phone: string; email: string | null; city: string | null; qty: number; message: string | null; status: string; note: string | null; product: { id: number; slug: string; name: string; brand: string } | null };
type Summary = {
  orders: Record<string, { count: number; total: number }>; last24h: { count: number; total: number }; openEnquiries: number; openBulk: number;
  catalog: { products: number; priceOnRequest: number; noOrigin: number; hidden: number; outOfStock: number };
  setup: { email: boolean; storeEmail: string; admins: number; gaps: string[] };
};
type Tab = "overview" | "orders" | "requests" | "bulk" | "products";

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
            {([["overview", "Overview", ClipboardList], ["orders", "Orders", Package], ["requests", "Requests", Inbox], ["bulk", "Bulk", Building2], ["products", "Products", Store]] as const).map(([k, label, I]) => (
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
  const checks: [boolean, string][] = [
    [s.setup.email, s.setup.email ? "Order emails are on (Brevo)." : "Order emails are off: set BREVO_API_KEY (npx wrangler secret put BREVO_API_KEY)."],
    [true, `New orders and requests are emailed to ${s.setup.storeEmail}.`],
    [s.catalog.priceOnRequest === 0, s.catalog.priceOnRequest ? `${s.catalog.priceOnRequest} products are price on request: set prices under Products to sell them directly.` : "Every product has a price."],
    [s.catalog.noOrigin === 0, s.catalog.noOrigin ? `${s.catalog.noOrigin} products don't show a country of origin yet: add it under Products (it's on the pack).` : "Every product shows its country of origin."],
    ...s.setup.gaps.map((g) => [false, `Missing: ${g}`] as [boolean, string]),
  ];
  return (
    <div className="ax-adm-over">
      <div className="ax-adm-stats">
        <button type="button" onClick={() => go("orders")}><small>New orders</small><b>{o("placed")}</b><span>to confirm</span></button>
        <button type="button" onClick={() => go("orders")}><small>To ship</small><b>{o("confirmed")}</b><span>confirmed</span></button>
        <button type="button" onClick={() => go("orders")}><small>On the way</small><b>{o("shipped")}</b><span>shipped</span></button>
        <button type="button" onClick={() => go("requests")}><small>Requests</small><b>{s.openEnquiries}</b><span>waiting for a reply</span></button>
        <button type="button" onClick={() => go("bulk")}><small>Bulk requests</small><b>{s.openBulk ?? 0}</b><span>to quote</span></button>
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

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = { placed: ["confirmed", "cancelled"], confirmed: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"] };

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

function OrderEditor({ order, onSaved }: { order: AdminOrder; onSaved: (o: AdminOrder) => void }) {
  const [courier, setCourier] = useState(order.tracking?.courier ?? "");
  const [number, setNumber] = useState(order.tracking?.number ?? "");
  const [url, setUrl] = useState(order.tracking?.url ?? "");
  const [note, setNote] = useState("");
  const [adminNote, setAdminNote] = useState(order.adminNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const a = order.address;

  const save = async (status?: OrderStatus) => {
    if (status === "cancelled" && !window.confirm(`Cancel order ${order.id}? The customer is told by email.`)) return;
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ order: AdminOrder; emailed?: boolean }>(`orders/${order.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), note: note.trim() || undefined, adminNote, tracking: { courier, number, url } } });
      onSaved({ ...order, ...r.order });
      setNote("");
      setMsg(status ? `Marked ${STATUS_LABEL[status].toLowerCase()}${r.emailed ? "; the customer was emailed" : a.email ? "; the email didn't go out" : " (no email on this order: call or message the customer)"}.` : "Saved.");
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
        </div>
        <div>
          <h3>Items</h3>
          <ul className="items">
            {order.lines.map((l) => <li key={`${l.productId}:${l.variantId ?? ""}`}><Link href={`/products/${l.slug}`}>{l.name}</Link>{l.variantLabel ? ` (${l.variantLabel})` : ""} × {l.qty} <b>{formatINR(l.lineTotal)}</b></li>)}
          </ul>
          <p>Delivery {order.delivery ? formatINR(order.delivery) : "free"} · <b>Collect {formatINR(order.total)} cash</b></p>
        </div>
        <div>
          <h3>History</h3>
          <ul className="hist">{order.history.map((h, i) => <li key={i}><b>{STATUS_LABEL[h.status]}</b> {when(h.at)}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
        </div>
      </div>
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
              <div className="h"><span className={`kind k-${e.kind}`}>{({ price: "Price", book: "Book", bulk: "Bulk", general: "Question" } as Record<string, string>)[e.kind] ?? e.kind}</span><b>{e.item || "General question"}</b>{e.kind !== "general" && <span>× {e.qty}</span>}<span className="muted">{when(e.created_at)}</span></div>
              <p>{e.name} · <a href={`tel:+91${e.phone}`}>+91 {e.phone}</a>{e.email ? <> · <a href={`mailto:${e.email}`}>{e.email}</a></> : null}{e.city ? ` · ${e.city}` : ""}</p>
              {e.message && <p className="msg">{e.message}</p>}
              <div className="acts">
                {e.product && <Link href={`/products/${e.product.slug}`} className="ax-link">Product page <ExternalLink size={12} /></Link>}
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
  const { data: store } = useStore();
  const [note, setNote] = useState(req.adminNote);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const brand = (slug: string) => store?.brandName(slug) ?? slug;
  const asText = () => [
    `${req.institution} (${req.instType}), ${req.city}, ${req.state} ${req.pincode}`,
    ...req.items.map((i) => `${i.qty} x ${brand(i.brand)} ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""}${i.unitPrice === null ? " [price on request]" : ` [store price ${i.unitPrice}]`}`),
    req.schedule ? `Repeat delivery: ${scheduleText(req.schedule)}${req.needBy ? `, the first by ${formatDay(req.needBy)}` : ""}` : req.needBy ? `Needed by ${formatDay(req.needBy)}` : "",
    req.notes ? `Notes: ${req.notes}` : "",
  ].filter(Boolean).join("\n");
  const copy = async () => { try { await navigator.clipboard.writeText(asText()); setMsg("The list is copied."); } catch { setMsg("Couldn't copy: select the items and copy them instead."); } };
  const save = async (status?: BulkStatus) => {
    setBusy(true); setMsg("");
    try {
      const r = await admin<{ request: AdminBulk }>(`bulk/${req.id}`, { method: "PATCH", json: { ...(status ? { status } : {}), adminNote: note } });
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
                  {i.qty.toLocaleString("en-IN")} × <Link href={`/products/${i.slug}`}>{brand(i.brand)} {i.name}</Link>{i.variantLabel ? ` (${i.variantLabel})` : ""}
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
      </div>
      <div className="acts">
        <a className="ax-btn teal" href={`mailto:${req.email}?subject=${subject}`}><Mail size={15} /> Email the quotation</a>
        <button type="button" className="ax-btn" onClick={copy}><Copy size={15} /> Copy the list</button>
        {(["quoted", "ordered", "closed"] as BulkStatus[]).filter((s) => s !== req.status).map((s) => (
          <button key={s} type="button" className="ax-btn" disabled={busy} onClick={() => save(s)}><Check size={15} /> Mark {BULK_STATUS_LABEL[s].toLowerCase()}</button>
        ))}
        {req.status !== "new" && <button type="button" className="ax-btn" disabled={busy} onClick={() => save("new")}>Back to new</button>}
        <button type="button" className="ax-btn" disabled={busy} onClick={() => save()}>Save note</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ products */

function Products() {
  const { data: store, refetch } = useStore();
  const [ov, setOv] = useState<Record<string, Override & { updatedAt?: number }>>({});
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [only, setOnly] = useState<"" | "por" | "changed" | "oos">("");
  const [open, setOpen] = useState<number | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { admin<{ overrides: Record<string, Override> }>("overrides").then((r) => setOv(r.overrides)).catch((e) => setErr(e.message)); }, []);

  const list = useMemo(() => {
    if (!store) return [];
    const w = q.trim().toLowerCase();
    // Hidden products aren't in the public list: add them back from the overrides.
    return store.products.filter((p) => (!brand || p.brand === brand) && (!w || `${p.name} ${p.model ?? ""} ${p.id}`.toLowerCase().includes(w))
      && (only !== "por" || p.priceOnRequest) && (only !== "changed" || ov[p.id]) && (only !== "oos" || !p.inStock));
  }, [store, q, brand, only, ov]);
  const hiddenIds = Object.entries(ov).filter(([, o]) => o.hidden).map(([id]) => Number(id));

  if (!store) return <p className="ax-adm-loading"><Loader2 size={18} className="spin" /> Loading…</p>;
  return (
    <div>
      <div className="ax-adm-bar">
        <form onSubmit={(e) => e.preventDefault()} className="find"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, model or number" /></form>
        <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand"><option value="">All brands</option>{store.brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}</select>
        <div className="seg">{([["", "All"], ["por", "Price on request"], ["oos", "Out of stock"], ["changed", "Changed"]] as const).map(([k, l]) => <button key={k} type="button" className={only === k ? "on" : ""} onClick={() => setOnly(k)}>{l}</button>)}</div>
      </div>
      {err && <p className="ax-form-err">{err}</p>}
      {hiddenIds.length > 0 && <p className="fine">{hiddenIds.length} hidden product{hiddenIds.length === 1 ? "" : "s"} (numbers {hiddenIds.join(", ")}). Open one by searching its number to show it again.</p>}
      <p className="fine">{list.length} products. Prices include taxes. Changes show on the site within a minute.</p>
      <ul className="ax-adm-prods">
        {list.slice(0, 200).map((p) => (
          <li key={p.id} className={open === p.id ? "open" : ""}>
            <button type="button" className="row" onClick={() => setOpen(open === p.id ? null : p.id)}>
              <span className="pic"><ProductImage src={p.image} width={96} /></span>
              <span className="nm"><b>{p.name}</b><small>#{p.id} · {store.brandName(p.brand)}{p.variants ? ` · ${p.variants.length} ${(p.optionName ?? "option").toLowerCase()}s` : ""}</small></span>
              <span className="pr">{p.priceOnRequest ? <em>Price on request</em> : <>{p.from ? "from " : ""}{formatINR(Number(p.price))}</>}</span>
              <span className={`st${p.inStock ? "" : " out"}`}>{p.inStock ? "In stock" : "Out of stock"}</span>
              {ov[p.id] && <span className="chg">Changed</span>}
            </button>
            {open === p.id && <ProductEditor p={p} store={store} current={ov[p.id]} onSaved={(o) => { setOv((m) => { const n = { ...m }; if (o) n[p.id] = o; else delete n[p.id]; return n; }); refetch(); }} />}
          </li>
        ))}
      </ul>
      {/* hidden products can be found by number */}
      {/^\d+$/.test(q.trim()) && hiddenIds.includes(Number(q.trim())) && (
        <div className="ax-adm-hidden"><p>Product #{q.trim()} is hidden.</p><button type="button" className="ax-btn" onClick={async () => { await admin(`overrides/${q.trim()}`, { method: "PUT", json: {} }); setOv((m) => { const n = { ...m }; delete n[q.trim()]; return n; }); refetch(); }}>Show it again</button></div>
      )}
    </div>
  );
}

function ProductEditor({ p, store, current, onSaved }: { p: ProductSummary; store: StoreData; current?: Override; onSaved: (o: Override | null) => void }) {
  const variantsPriced = !!p.variants?.some((v) => v.price !== undefined) && !current?.variants;
  const [price, setPrice] = useState(current?.price != null ? String(current.price) : "");
  const [mrp, setMrp] = useState(current?.mrp != null ? String(current.mrp) : "");
  const [inStock, setInStock] = useState(current?.inStock ?? p.inStock);
  const [coo, setCoo] = useState(current?.countryOfOrigin ?? "");
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
      <p className="fine">{p.priceOnRequest ? `${store.brandName(p.brand)} doesn't publish Indian prices: set a selling price and MRP to sell it directly. Leave the price empty to keep it on request.` : "Leave a field empty to keep the brand's price."}{variantsPriced ? " Sizes or colours have their own prices below." : ""} <Link href={`/products/${p.slug}`}>Open product page</Link></p>
      <div className="ax-form">
        <label className="f"><span>Selling price (₹)</span><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder={p.priceOnRequest ? "On request" : String(p.price ?? "")} /></label>
        <label className="f"><span>MRP (₹)</span><input value={mrp} onChange={(e) => setMrp(e.target.value)} inputMode="decimal" placeholder={p.mrp ? String(p.mrp) : ""} /></label>
        <label className="f"><span>Country of origin</span><input value={coo} onChange={(e) => setCoo(e.target.value)} placeholder="As on the pack" maxLength={60} /></label>
        <label className="ax-switch f"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /><span className="track"><i /></span><span>In stock</span></label>
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
        {current && <button type="button" className="ax-btn" disabled={busy} onClick={() => save({}, "Back to the brand's details.")}>Undo all changes</button>}
        <button type="button" className="ax-btn danger" disabled={busy} onClick={() => { if (window.confirm(`Hide ${p.name} from the store?`)) save(build(true), "Hidden from the store."); }}>Hide from store</button>
        {busy && <Loader2 size={16} className="spin" />}
      </div>
      {msg && <p className="ax-adm-msg">{msg}</p>}
    </div>
  );
}
