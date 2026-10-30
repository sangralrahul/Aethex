/**
 * Update 80: more of the store.
 * - ReorderRemind (product page): "Remind me to reorder" every 7 to 180 days, by email with a one-click reorder link.
 * - RemindersPanel (My orders): the reminders, to change or stop.
 * - ReportProblem (a delivered order's item): ask for a replacement (damaged, defective, wrong, missing), and see
 *   where it stands.
 * - WhatsAppOrder: share an order's status, or ask the store about it, on WhatsApp.
 * Styles: src/shop.css (.ax-remind, .ax-rep, .ax-wa).
 */
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Loader2, MessageCircle, Repeat, Share2, Trash2, TriangleAlert } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { useToast } from "@/hooks/use-toast";
import { askReplacement, deleteReminder, REORDER_EVERY, setReminder, useReminders, useStore, useStoreConfig, type CustomerOrder, type Replacement, type StoreError } from "@/lib/store/api";
import { STATUS_LABEL } from "@/lib/store/rules";
import type { PricedLine } from "@/lib/store/types";
import { BUSINESS, SITE_URL } from "@/config/business";
import { loginUrl } from "@/lib/host";

/* ---------------------------------------------------------------- reorder reminders */
export function ReorderRemind({ productId, variantId, name }: { productId: number; variantId: string | null; name: string }) {
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const { data } = useReminders(isLoggedIn);
  const cur = data?.find((r) => r.productId === productId && (r.variantId ?? null) === (variantId ?? null));
  const [open, setOpen] = useState(false), [every, setEvery] = useState(cur?.everyDays ?? 30), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try { const r = await setReminder({ productId, variantId, everyDays: every }); qc.setQueryData(["store", "reminders"], r.reminders); setOpen(false); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  if (!isLoggedIn) return <a className="ax-remind-link" href={loginUrl("/", { next: typeof window === "undefined" ? "/" : window.location.pathname })}><Repeat size={15} /> Remind me to reorder</a>;
  return (
    <div className="ax-remind" data-store="remind">
      {!open ? (
        <button type="button" className="ax-remind-link" onClick={() => { setEvery(cur?.everyDays ?? 30); setOpen(true); }} data-store="remind-open">
          {cur ? <><BellRing size={15} /> Reminder every {cur.everyDays} days · change</> : <><Repeat size={15} /> Remind me to reorder</>}
        </button>
      ) : (
        <div className="box">
          <b>Email me to reorder {name}</b>
          <div className="row">
            <span>every</span>
            <select value={every} onChange={(e) => setEvery(Number(e.target.value))} aria-label="How often">{REORDER_EVERY.map((d) => <option key={d} value={d}>{d} days</option>)}</select>
            <button type="button" className="ax-btn teal" disabled={busy} onClick={() => void save()} data-store="remind-save">{busy ? <Loader2 size={15} className="spin" /> : <Check size={15} />} {cur ? "Update" : "Remind me"}</button>
            {cur && <button type="button" className="ax-link" onClick={async () => { const r = await deleteReminder(cur.id); qc.setQueryData(["store", "reminders"], r.reminders); setOpen(false); }}>Stop</button>}
            <button type="button" className="ax-link" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <small>The email has a one-click reorder link. Stop it any time from My orders.</small>
          {err && <p className="ax-form-err">{err}</p>}
        </div>
      )}
    </div>
  );
}

export function RemindersPanel() {
  const { isLoggedIn } = useUserAuth();
  const qc = useQueryClient();
  const { data } = useReminders(isLoggedIn);
  const { data: store } = useStore(!!data?.length);
  if (!isLoggedIn || !data?.length) return null;
  return (
    <section className="ax-reminders" data-store="reminders">
      <h2><Repeat size={18} /> Reorder reminders</h2>
      <ul>{data.map((r) => {
        const p = store?.byId.get(r.productId);
        return (
          <li key={r.id} data-reminder={r.id}>
            <span><b>{p ? `${store?.brandName(p.brand) ?? ""} ${p.name}` : `Item ${r.productId}`}</b><small>Every {r.everyDays} days · next {new Date(r.nextAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></span>
            <select value={r.everyDays} onChange={async (e) => { const x = await setReminder({ productId: r.productId, variantId: r.variantId, everyDays: Number(e.target.value), qty: r.qty }); qc.setQueryData(["store", "reminders"], x.reminders); }} aria-label="How often">{REORDER_EVERY.map((d) => <option key={d} value={d}>{d} days</option>)}</select>
            {p && <Link href={`/reorder?p=${r.productId}${r.variantId ? `&v=${encodeURIComponent(r.variantId)}` : ""}&q=${r.qty}`} className="ax-btn">Reorder now</Link>}
            <button type="button" className="ax-icon-btn" onClick={async () => { const x = await deleteReminder(r.id); qc.setQueryData(["store", "reminders"], x.reminders); }} aria-label="Stop this reminder"><Trash2 size={15} /></button>
          </li>
        );
      })}</ul>
    </section>
  );
}

/* ---------------------------------------------------------------- replacements */
const REASONS: [string, string][] = [["damaged", "Arrived damaged"], ["defective", "Doesn't work (defective)"], ["wrong", "Wrong item sent"], ["missing", "Item or part missing"]];
export function canReport(o: CustomerOrder) {
  if (o.status !== "delivered") return false;
  const at = [...o.history].reverse().find((h) => h.status === "delivered")?.at ?? o.createdAt;
  return Date.now() - at <= (BUSINESS.replacementDays + 1) * 86400_000;
}
export function ReportProblem({ order, line, access, onDone }: { order: CustomerOrder; line: PricedLine; access: { token?: string; phone?: string }; onDone: (r: Replacement[]) => void }) {
  const existing = order.replacements?.find((r) => r.productId === line.productId && (r.variantId ?? null) === (line.variantId ?? null));
  const [open, setOpen] = useState(false), [reason, setReason] = useState(""), [qty, setQty] = useState(1), [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  if (existing) return <span className={`ax-rep-status s-${existing.status}`} data-store="rep-status"><TriangleAlert size={13} /> {existing.statusText}{existing.note ? `: ${existing.note}` : ""}</span>;
  if (!canReport(order)) return null;
  const send = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await askReplacement(order.id, { productId: line.productId, variantId: line.variantId ?? null, qty, reason, details }, access); onDone(r.replacements); setOpen(false); } catch (x) { setErr((x as StoreError).message); } finally { setBusy(false); }
  };
  return !open ? <button type="button" className="ax-link" onClick={() => setOpen(true)} data-store="report"><TriangleAlert size={13} /> Report a problem</button> : (
    <form className="ax-rep" onSubmit={send} data-store="rep-form">
      <div className="reasons" role="radiogroup" aria-label="What's wrong">{REASONS.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={reason === k} className={reason === k ? "on" : ""} onClick={() => setReason(k)} data-reason={k}>{l}</button>)}</div>
      {line.qty > 1 && <label className="f"><span>How many</span><select value={qty} onChange={(e) => setQty(Number(e.target.value))}>{Array.from({ length: line.qty }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>}
      <label className="f wide"><span>What happened?</span><textarea required minLength={10} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="For example: the box was crushed and the cuff is torn." /></label>
      <p className="fine">We reply within one business day and may ask for a photo by email or WhatsApp. Report within {BUSINESS.replacementDays} days of delivery.</p>
      {err && <p className="ax-form-err">{err}</p>}
      <div className="row"><button type="submit" className="ax-btn teal" disabled={busy || !reason}>{busy ? <Loader2 size={15} className="spin" /> : null} Send request</button><button type="button" className="ax-btn" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>
  );
}

/* ---------------------------------------------------------------- WhatsApp */
export function WhatsAppOrder({ order }: { order: CustomerOrder }) {
  const { data: config } = useStoreConfig();
  const { toast } = useToast();
  const track = order.tracking?.url || `${SITE_URL}/orders/track?id=${encodeURIComponent(order.id)}`;
  const items = order.lines.slice(0, 3).map((l) => `${l.name} × ${l.qty}`).join(", ") + (order.lines.length > 3 ? ` and ${order.lines.length - 3} more` : "");
  const status = `Aethex order ${order.id}: ${STATUS_LABEL[order.status]}${order.tracking?.courier ? ` with ${order.tracking.courier}${order.tracking.number ? ` (${order.tracking.number})` : ""}` : ""}.\n${items}\nTrack it: ${track}`;
  const share = async () => {
    if (typeof navigator.share === "function") { try { await navigator.share({ title: `Order ${order.id}`, text: status }); return; } catch { /* closed */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(status)}`, "_blank", "noopener");
    toast({ title: "Opening WhatsApp" });
  };
  return (
    <div className="ax-wa" data-store="whatsapp">
      <a className="ax-btn" href={`https://wa.me/?text=${encodeURIComponent(status)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (typeof navigator.share === "function") { e.preventDefault(); void share(); } }} data-store="wa-share"><Share2 size={15} /> Share status on WhatsApp</a>
      {config?.whatsapp && <a className="ax-btn" href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Hi Aethex, about my order ${order.id} (${STATUS_LABEL[order.status]}):`)}`} target="_blank" rel="noopener noreferrer" data-store="wa-ask"><MessageCircle size={15} /> Ask about it on WhatsApp</a>}
    </div>
  );
}
