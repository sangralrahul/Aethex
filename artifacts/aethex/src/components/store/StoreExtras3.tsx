/**
 * Update 84: more for the store.
 * - Prescriptions: RxBadge (product pages), RxUpload (checkout, for items the store marked "needs a prescription"),
 *   RxStatus (the order page: being checked, approved, or send a clearer one).
 * - Store credit: useCredit, CreditToggle (checkout), CreditPanel (My orders).
 * - Delivery times: useEta (from the store's own deliveries to that area, else its promise), ArrivingBy (order page).
 * - Gifts: GiftShare (the buyer's link for the recipient), GiftPage (/gift/:token, no prices), printGiftSlip (admin).
 * Styles: src/shop.css (.ax-rx*, .ax-credit*, .ax-gift*).
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Copy, FileCheck2, FileWarning, Gift, Loader2, Package, PackageCheck, Truck, Upload, Wallet } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { useUserAuth } from "@/hooks/use-user-auth";
import { storeFetch, type StoreError } from "@/lib/store/api";
import type { Order } from "@/lib/store/types";
import { BUSINESS } from "@/config/business";
import { formatINR } from "@/lib/utils";
import { ProductImage } from "@/components/store/ProductImage";

const MAX = 1_048_576;
const toB64 = (buf: ArrayBuffer) => { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
/** A photo is redrawn as a JPEG under 1 MB; a PDF must be under 1 MB already. */
export async function fileForUpload(file: Blob, name: string): Promise<{ name: string; data: string }> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(name)) {
    if (file.size > MAX) throw new Error("This PDF is over 1 MB. A clear photo of the prescription works well.");
    return { name, data: toB64(await file.arrayBuffer()) };
  }
  if (!file.type.startsWith("image/")) throw new Error("Upload a photo or a PDF.");
  if (file.size <= MAX && /^image\/(jpeg|png|webp)$/.test(file.type)) return { name, data: toB64(await file.arrayBuffer()) };
  const img = await createImageBitmap(file);
  for (const [side, q] of [[2200, 0.85], [1800, 0.8], [1400, 0.74], [1100, 0.68]] as const) {
    const k = Math.min(1, side / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const out = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", q));
    if (out && out.size <= MAX) return { name: name.replace(/\.[^.]+$/, "") + ".jpg", data: toB64(await out.arrayBuffer()) };
  }
  throw new Error("This photo is too large. Try taking it again a little further away.");
}

/* ---------------------------------------------------------------- prescriptions */
export function RxBadge() {
  return <p className="ax-rx-badge" data-store="rx-badge"><FileCheck2 size={15} /> <span><b>Prescription needed.</b> Upload your doctor&apos;s prescription at checkout; we check it before the order ships.</span></p>;
}
export type RxFile = { name: string; data: string } | null;
export function RxUpload({ value, onChange, items }: { value: RxFile; onChange: (f: RxFile) => void; items: string[] }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  return (
    <div className="ax-rx-up" data-store="rx-upload">
      <p><FileCheck2 size={16} /> <span><b>A prescription is needed for</b> {items.join(", ")}. Upload a clear photo or PDF of it, with the doctor&apos;s name, registration number and signature. We check it before shipping.</span></p>
      <div className="row">
        <label className="ax-btn"><Upload size={15} /> {busy ? "Preparing…" : value ? "Change the file" : "Upload prescription"}
          <input type="file" accept="image/*,application/pdf" hidden disabled={busy} data-store="rx-file" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
            setBusy(true); setErr("");
            try { onChange(await fileForUpload(f, f.name)); } catch (x) { setErr((x as Error).message); onChange(null); } finally { setBusy(false); }
          }} />
        </label>
        {value && <span className="ok" data-store="rx-ready"><CheckCircle2 size={15} /> {value.name}</span>}
      </div>
      {err && <p className="ax-form-err" role="alert">{err}</p>}
    </div>
  );
}
export function RxStatus({ order, token, onChange }: { order: Order; token?: string; onChange: (o: Order) => void }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const rx = order.rx;
  if (!rx) return null;
  const canSend = (rx.status === "pending" || rx.status === "rejected") && !["shipped", "delivered", "cancelled"].includes(order.status);
  const open = async () => {
    const r = await fetch(`/api/store/orders/${order.id}/rx`, { credentials: "same-origin", headers: token ? { "x-order-token": token } : {} });
    if (!r.ok) { setErr("Couldn't open it."); return; }
    const u = URL.createObjectURL(await r.blob()); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 60000);
  };
  return (
    <div className={`ax-rx-status s-${rx.status}`} data-store="rx-status" data-rx={rx.status}>
      {rx.status === "approved" ? <CheckCircle2 size={18} /> : rx.status === "rejected" ? <FileWarning size={18} /> : <Clock size={18} />}
      <div>
        <b>{rx.status === "approved" ? "Prescription checked" : rx.status === "rejected" ? "Please send the prescription again" : "We're checking your prescription"}</b>
        <p>{rx.status === "rejected" ? rx.note ?? "We couldn't read it." : rx.status === "approved" ? "Your order can ship." : "Your order ships once it's checked, usually within a business day."}</p>
        <div className="row">
          <button type="button" className="ax-link" onClick={() => void open()}>See what you sent</button>
          {canSend && <label className="ax-link up">{busy ? "Uploading…" : "Upload a clearer one"}<input type="file" accept="image/*,application/pdf" hidden disabled={busy} data-store="rx-again" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
            setBusy(true); setErr("");
            try { const file = await fileForUpload(f, f.name); const r = await storeFetch<{ order: Order }>(`/orders/${order.id}/rx`, { json: { rx: file }, ...(token ? { headers: { "x-order-token": token } } : {}) }); onChange(r.order); }
            catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
          }} /></label>}
        </div>
        {err && <p className="ax-form-err" role="alert">{err}</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- store credit */
export type CreditEntry = { id: string; amount: number; kind: string; orderId: string | null; note: string | null; at: number; returned: boolean };
export function useCredit() {
  const { isLoggedIn } = useUserAuth();
  return useQuery({ enabled: isLoggedIn, queryKey: ["store", "credit"], queryFn: () => storeFetch<{ balance: number; history: CreditEntry[] }>("/credit"), retry: false, staleTime: 30_000 });
}
export function CreditToggle({ total, on, setOn }: { total: number; on: boolean; setOn: (v: boolean) => void }) {
  const { data } = useCredit();
  if (!data || data.balance <= 0) return null;
  const use = Math.min(data.balance, total);
  return (
    <label className={`ax-extra ax-credit-use${on ? " on" : ""}`} data-store="use-credit">
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
      <span className="ic"><Wallet size={18} /></span>
      <span className="tx"><b>Use store credit: {formatINR(use)}</b><small>You have {formatINR(data.balance)}{use >= total ? ". It covers the whole order." : `. ${formatINR(total - use)} left to pay.`}</small></span>
    </label>
  );
}
const KIND: Record<string, string> = { grant: "Added by Aethex", refund: "Refund", adjust: "Adjusted", use: "Used on an order" };
export function CreditPanel() {
  const { data } = useCredit();
  if (!data || (data.balance <= 0 && !data.history.length)) return null;
  return (
    <section className="ax-credit" data-store="credit">
      <div className="hd"><Wallet size={20} /><div><small>Store credit</small><b data-store="credit-balance">{formatINR(data.balance)}</b></div><p>Taken off your next order at checkout. It doesn&apos;t expire.</p></div>
      {data.history.length > 0 && <details><summary>History</summary><ul>{data.history.map((c) => (
        <li key={c.id} className={c.amount > 0 ? "in" : c.returned ? "back" : "out"}><span>{KIND[c.kind] ?? c.kind}{c.orderId ? <> · <Link href={`/order/${c.orderId}`}>{c.orderId}</Link></> : null}{c.note && c.kind !== "use" ? <small>{c.note}</small> : null}{c.returned ? <small>Order cancelled: the credit came back</small> : null}</span><b>{c.amount > 0 ? "+" : "−"}{formatINR(Math.abs(c.amount))}</b><em>{new Date(c.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</em></li>
      ))}</ul></details>}
    </section>
  );
}

/* ---------------------------------------------------------------- delivery times */
export type Eta = { basis: "orders" | "promise"; area?: "district" | "region"; samples: number; dispatch: [number, number]; transit: [number, number] };
export const useEta = (pin: string) => useQuery({ enabled: /^[1-9]\d{5}$/.test(pin), queryKey: ["store", "eta", pin], queryFn: () => storeFetch<Eta>(`/eta?pin=${pin}`), staleTime: 15 * 60_000, retry: false });
const isWorkday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;
export function addWorkdays(from: Date, n: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let left = n; left > 0;) { d.setDate(d.getDate() + 1); if (isWorkday(d)) left--; }
  return d;
}
/** When an order placed now, or shipped on `shippedAt`, arrives at that PIN. */
export function etaWindow(eta: Eta, shippedAt?: number) {
  const base = shippedAt ? new Date(shippedAt) : new Date();
  return shippedAt ? { from: addWorkdays(base, eta.transit[0]), to: addWorkdays(base, eta.transit[1]) }
    : { from: addWorkdays(base, eta.dispatch[0] + eta.transit[0]), to: addWorkdays(base, eta.dispatch[1] + eta.transit[1]) };
}
export const etaBasis = (eta: Eta) => (eta.basis === "orders" ? `From our last ${eta.samples} deliveries to your ${eta.area === "district" ? "area" : "region"}` : "The store's usual delivery time");
const dayText = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
export function ArrivingBy({ order }: { order: Order }) {
  const { data: eta } = useEta(order.address.pincode);
  const shipped = order.history.find((h) => h.status === "shipped")?.at;
  if (!eta || !["placed", "confirmed", "shipped"].includes(order.status)) return null;
  const w = etaWindow(eta, order.status === "shipped" ? shipped : undefined);
  if (order.status !== "shipped" && order.rx && order.rx.status !== "approved") return null;
  return <p className="ax-eta" data-store="arriving-by"><Truck size={16} /> <span>Expected <b>{dayText(w.from)}{+w.to !== +w.from ? ` – ${dayText(w.to)}` : ""}</b><small>{etaBasis(eta)}. Business days, Monday to Friday.</small></span></p>;
}

/* ---------------------------------------------------------------- gifts */
export function GiftShare({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  if (!order.gift?.token || order.status === "pending" || order.status === "cancelled") return null;
  const link = `${window.location.origin}/gift/${order.gift.token}`;
  return (
    <div className="ax-gift-share" data-store="gift-share">
      <Gift size={16} /><span>{order.gift.toEmail ? <>We&apos;ll email <b>{order.gift.toEmail}</b> when it ships and arrives. </> : null}Share this link so they can follow it, without any prices:</span>
      <div className="row"><input readOnly value={link} aria-label="Gift link" onFocus={(e) => e.target.select()} /><button type="button" className="ax-btn" onClick={() => { void navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><Copy size={15} /> {copied ? "Copied" : "Copy"}</button></div>
    </div>
  );
}
type GiftView = { id: string; status: string; from: string | null; message: string | null; items: { productId: number; name: string; variantLabel: string | null; qty: number; image: string | null }[]; history: { status: string; at: number }[]; tracking: Order["tracking"] | null; city: string; cod: number };
const STEPS = [["placed", "Ordered", Package], ["confirmed", "Packed", PackageCheck], ["shipped", "On the way", Truck], ["delivered", "Delivered", CheckCircle2]] as const;
export function GiftPage() {
  const { token = "" } = useParams<{ token: string }>();
  useSeo({ title: "Your gift | Aethex", description: "A gift on its way to you.", path: `/gift/${token}` });
  const { data, error, isLoading } = useQuery({ queryKey: ["store", "gift", token], queryFn: () => storeFetch<{ gift: GiftView }>(`/gift/${token}`).then((r) => r.gift), retry: false });
  const at = useMemo(() => new Map((data?.history ?? []).map((h) => [h.status, h.at])), [data]);
  if (isLoading) return <div className="ax-wrap ax-orders-loading"><Loader2 size={20} className="spin" /> Loading…</div>;
  if (error || !data) return <div className="ax-wrap ax-empty" style={{ margin: "48px auto" }}><h2>Gift link not valid</h2><p>{(error as StoreError | null)?.message ?? ""}</p><Link href="/shop" className="ax-btn teal">Visit the store</Link></div>;
  const cancelled = data.status === "cancelled";
  const idx = STEPS.findIndex(([s]) => s === data.status);
  return (
    <div className="ax-wrap ax-gift" data-store="gift-page">
      <div className="ax-gift-hero"><Gift size={30} /><h1>{data.from ? `A gift from ${data.from}` : "A gift for you"}</h1>{data.message && <blockquote data-store="gift-message">{data.message}</blockquote>}</div>
      {cancelled ? <p className="ax-form-err">This gift order was cancelled.</p> : (
        <ol className="ax-gift-steps">{STEPS.map(([s, label, I], i) => <li key={s} className={i <= idx ? "done" : ""}><I size={18} /><b>{label}</b>{at.get(s) ? <small>{new Date(at.get(s)!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small> : null}</li>)}</ol>
      )}
      {data.tracking?.url && <p className="ax-gift-track"><Truck size={15} /> <a href={data.tracking.url} target="_blank" rel="noopener noreferrer">Track with {data.tracking.courier ?? "the courier"}{data.tracking.number ? ` (${data.tracking.number})` : ""}</a></p>}
      <ul className="ax-gift-items">{data.items.map((l, i) => <li key={i}><span className="pic">{l.image ? <ProductImage src={l.image} width={120} /> : <Package size={20} />}</span><span><b>{l.name}</b>{l.variantLabel && <small>{l.variantLabel}</small>}</span>{l.qty > 1 && <em>×{l.qty}</em>}</li>)}</ul>
      {data.cod > 0 && !cancelled && data.status !== "delivered" && <p className="ax-gift-cod">It&apos;s cash on delivery: please keep {formatINR(data.cod)} ready.</p>}
      <p className="fine">Delivery to {data.city}. Questions? Write to {BUSINESS.email} with order {data.id}.</p>
    </div>
  );
}

/** A printable note and packing slip for a gift: the message, the items, no prices. Opens the print dialog. */
export function printGiftSlip(o: Order) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const w = window.open("", "_blank", "width=720,height=900");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Gift slip ${esc(o.id)}</title><style>body{font-family:system-ui,sans-serif;margin:40px;color:#111}h1{font-size:22px;margin:0 0 4px}.msg{margin:22px 0;padding:22px;border:2px dashed #0d9488;border-radius:14px;font-size:20px;line-height:1.5;white-space:pre-wrap}table{width:100%;border-collapse:collapse;margin-top:18px}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}small{color:#555}</style></head><body>
<h1>A gift for ${esc(o.address.name)}</h1><small>Order ${esc(o.id)}</small>
${o.gift?.message || o.gift?.from ? `<div class="msg">${o.gift?.message ? esc(o.gift.message) : ""}${o.gift?.from ? `<br><br>— ${esc(o.gift.from)}` : ""}</div>` : ""}
<table><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>${o.lines.map((l) => `<tr><td>${esc(l.name)}${l.variantLabel ? ` (${esc(l.variantLabel)})` : ""}</td><td>${l.qty}</td></tr>`).join("")}</tbody></table>
<p><small>Packed with care by ${esc(BUSINESS.brand)}. No prices are included with gifts.</small></p><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

/** Admin: give, refund or take back store credit, and see what's outstanding. */
export function CreditAdmin({ admin }: { admin: <T>(path: string, init?: { method?: string; json?: unknown }) => Promise<T> }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["store", "admin", "credit"], queryFn: () => admin<{ grants: (CreditEntry & { email: string | null; by: string | null })[]; outstanding: number }>("credit") });
  const [f, setF] = useState({ email: "", amount: "", note: "", orderId: "" }), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setMsg("");
    try { const r = await admin<{ balance: number; emailed: boolean }>("credit", { method: "POST", json: { ...f, amount: Number(f.amount) } }); setMsg(`Done. Their balance is now ${formatINR(r.balance)}${r.emailed ? "; they've been emailed" : ""}.`); setF({ email: "", amount: "", note: "", orderId: "" }); void qc.invalidateQueries({ queryKey: ["store", "admin", "credit"] }); }
    catch (x) { setMsg((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="ax-credit-admin" data-store="credit-admin">
      <p className="fine">Store credit is taken off a signed-in customer&apos;s next order. Credit used on an order that's cancelled comes back on its own. Outstanding: <b>{formatINR(data?.outstanding ?? 0)}</b>.</p>
      <div className="ax-form">
        <label className="f"><span>Customer's email</span><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} data-store="credit-email" /></label>
        <label className="f"><span>Amount (₹)</span><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="e.g. 250, or -250 to take back" data-store="credit-amount" /></label>
        <label className="f"><span>Order <em>(optional)</em></span><input value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value.toUpperCase() })} placeholder="AX…" /></label>
        <label className="f wide"><span>Reason (the customer sees it)</span><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} maxLength={200} placeholder="Refund for the damaged thermometer in order AX…" data-store="credit-note" /></label>
      </div>
      <button type="button" className="ax-btn teal" disabled={busy || !f.email || !f.amount} onClick={() => void save()} data-store="credit-save">Save</button>
      {msg && <p className="fine" role="status">{msg}</p>}
      {data && data.grants.length > 0 && <table className="ax-adm-vars"><thead><tr><th>When</th><th>Customer</th><th>Amount</th><th>Why</th></tr></thead><tbody>{data.grants.map((g) => <tr key={g.id}><td>{new Date(g.at).toLocaleDateString("en-IN")}</td><td>{g.email}</td><td>{g.amount > 0 ? "+" : "−"}{formatINR(Math.abs(g.amount))}</td><td>{g.note}{g.orderId ? ` · ${g.orderId}` : ""}</td></tr>)}</tbody></table>}
    </div>
  );
}
